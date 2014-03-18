/* Any copyright is dedicated to the Public Domain.
 * http://creativecommons.org/publicdomain/zero/1.0/ */

"use strict";

Cu.import("resource://testing-common/httpd.js");
XPCOMUtils.defineLazyModuleGetter(this, "Experiments",
  "resource:///modules/experiments/Experiments.jsm");

const FILE_MANIFEST            = "experiments.manifest";
const PREF_EXPERIMENTS_ENABLED = "experiments.enabled";
const PREF_LOGGING_LEVEL       = "experiments.logging.level";
const PREF_LOGGING_DUMP        = "experiments.logging.dump";
const PREF_MANIFEST_URI        = "experiments.manifest.uri";
const PREF_FETCHINTERVAL       = "experiments.manifest.fetchIntervalSeconds";

const MANIFEST_HANDLER         = "manifests/handler";

const SEC_IN_ONE_DAY  = 24 * 60 * 60;
const MS_IN_ONE_DAY   = SEC_IN_ONE_DAY * 1000;

let gProfileDir          = null;
let gHttpServer          = null;
let gHttpRoot            = null;
let gDataRoot            = null;
let gReporter            = null;
let gPolicy              = null;
let gManifestObject      = null;
let gManifestHandlerURI  = null;
let gTimerScheduleOffset = -1;

let gGlobalScope = this;
function loadAddonManager() {
  let ns = {};
  Cu.import("resource://gre/modules/Services.jsm", ns);
  let head = "../../../../toolkit/mozapps/extensions/test/xpcshell/head_addons.js";
  let file = do_get_file(head);
  let uri = ns.Services.io.newFileURI(file);
  ns.Services.scriptloader.loadSubScript(uri.spec, gGlobalScope);
  createAppInfo("xpcshell@tests.mozilla.org", "XPCShell", "1", "1.9.2");
  startupManager();
}

function run_test() {
  run_next_test();
}

add_task(function* test_setup() {
  loadAddonManager();
  gProfileDir = do_get_profile();

  gHttpServer = new HttpServer();
  gHttpServer.start(-1);
  let port = gHttpServer.identity.primaryPort;
  gHttpRoot = "http://localhost:" + port + "/";
  gDataRoot = gHttpRoot + "data/";
  gManifestHandlerURI = gHttpRoot + MANIFEST_HANDLER;
  gHttpServer.registerDirectory("/data/", do_get_cwd());
  gHttpServer.registerPathHandler("/" + MANIFEST_HANDLER, (request, response) => {
    response.setStatusLine(null, 200, "OK");
    response.write(JSON.stringify(gManifestObject));
    response.processAsync();
    response.finish();
  });
  do_register_cleanup(() => gHttpServer.stop(() => {}));

  Services.prefs.setBoolPref(PREF_EXPERIMENTS_ENABLED, true);
  Services.prefs.setIntPref(PREF_LOGGING_LEVEL, 0);
  Services.prefs.setBoolPref(PREF_LOGGING_DUMP, true);
  Services.prefs.setCharPref(PREF_MANIFEST_URI, gManifestHandlerURI);
  Services.prefs.setIntPref(PREF_FETCHINTERVAL, 0);

  gReporter = yield getReporter("json_payload_simple");
  yield gReporter.collectMeasurements();
  let payload = yield gReporter.getJSONPayload(true);

  gPolicy = new Experiments.Policy();
  patchPolicy(gPolicy, {
    updatechannel: () => "nightly",
    healthReportPayload: () => Promise.resolve(payload),
    oneshotTimer: (callback, timeout, thisObj, name) => gTimerScheduleOffset = timeout,
  });
});


// Test basic starting and stopping of experiments.

add_task(function* test_getExperiments() {
  const OBSERVER_TOPIC = "experiments-changed";
  let observerFireCount = 0;
  let expectedObserverFireCount = 0;
  let observer = () => ++observerFireCount;
  Services.obs.addObserver(observer, OBSERVER_TOPIC, false);

  // Dates the following tests are based on.

  let baseDate   = new Date(2014, 5, 1, 12);
  let startDate1 = futureDate(baseDate,  50 * MS_IN_ONE_DAY);
  let endDate1   = futureDate(baseDate, 100 * MS_IN_ONE_DAY);
  let startDate2 = futureDate(baseDate, 150 * MS_IN_ONE_DAY);
  let endDate2   = futureDate(baseDate, 200 * MS_IN_ONE_DAY);

  // The manifest data we test with.

  gManifestObject = {
    "version": 1,
    experiments: [
      {
        id:               EXPERIMENT2_ID,
        xpiURL:           gDataRoot + EXPERIMENT2_XPI_NAME,
        xpiHash:          EXPERIMENT2_XPI_SHA1,
        startTime:        dateToSeconds(startDate2),
        endTime:          dateToSeconds(endDate2),
        maxActiveSeconds: 10 * SEC_IN_ONE_DAY,
        appName:          ["XPCShell"],
        channel:          ["nightly"],
      },
      {
        id:               EXPERIMENT1_ID,
        xpiURL:           gDataRoot + EXPERIMENT1_XPI_NAME,
        xpiHash:          EXPERIMENT1_XPI_SHA1,
        startTime:        dateToSeconds(startDate1),
        endTime:          dateToSeconds(endDate1),
        maxActiveSeconds: 10 * SEC_IN_ONE_DAY,
        appName:          ["XPCShell"],
        channel:          ["nightly"],
      },
    ],
  };

  // Data to compare the result of Experiments.getExperiments() against.

  let experimentListData = [
    {
      id: EXPERIMENT2_ID,
      name: "Test experiment 2",
      description: "And yet another experiment that experiments experimentally.",
    },
    {
      id: EXPERIMENT1_ID,
      name: "Test experiment 1",
      description: "Yet another experiment that experiments experimentally.",
    },
  ];

  let experiments = new Experiments.Experiments(gPolicy);

  // Trigger update, clock set to before any activation.
  // Use updateManifest() to provide for coverage of that path.

  let now = baseDate;
  gTimerScheduleOffset = -1;
  defineNow(gPolicy, now);

  yield experiments.updateManifest();
  Assert.equal(observerFireCount, 0,
               "Experiments observer should not have been called yet.");
  let list = yield experiments.getExperiments();
  Assert.equal(list.length, 0, "Experiment list should be empty.");

  // Trigger update, clock set for experiment 1 to start.

  now = futureDate(startDate1, 5 * MS_IN_ONE_DAY);
  gTimerScheduleOffset = -1;
  defineNow(gPolicy, now);

  yield experiments.updateManifest();
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry now.");

  experimentListData[1].active = true;
  experimentListData[1].endDate = now.getTime() + 10 * MS_IN_ONE_DAY;
  for (let k of Object.keys(experimentListData[1])) {
    Assert.equal(experimentListData[1][k], list[0][k],
                 "Property " + k + " should match reference data.");
  }

  Assert.equal(gTimerScheduleOffset, 10 * MS_IN_ONE_DAY,
               "Experiment re-evaluation should have been scheduled correctly.");

  // Trigger update, clock set for experiment 1 to stop.

  now = futureDate(endDate1, 1000);
  gTimerScheduleOffset = -1;
  defineNow(gPolicy, now);

  yield experiments.updateManifest();
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry.");

  experimentListData[1].active = false;
  experimentListData[1].endDate = now.getTime();
  for (let k of Object.keys(experimentListData[1])) {
    Assert.equal(experimentListData[1][k], list[0][k],
                 "Property " + k + " should match reference data.");
  }

  Assert.equal(gTimerScheduleOffset, startDate2 - now,
               "Experiment re-evaluation should have been scheduled correctly.");

  // Trigger update, clock set for experiment 2 to start.
  // Use notify() to provide for coverage of that path.

  now = startDate2;
  gTimerScheduleOffset = -1;
  defineNow(gPolicy, now);

  experiments.notify();
  yield experiments._pendingTasksDone();
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 2, "Experiment list should have 2 entries now.");

  experimentListData[0].active = true;
  experimentListData[0].endDate = now.getTime() + 10 * MS_IN_ONE_DAY;
  for (let i=0; i<experimentListData.length; ++i) {
    let entry = experimentListData[i];
    for (let k of Object.keys(entry)) {
      Assert.equal(entry[k], list[i][k],
                   "Entry " + i + " - Property '" + k + "' should match reference data.");
    }
  }

  Assert.equal(gTimerScheduleOffset, 10 * MS_IN_ONE_DAY,
               "Experiment re-evaluation should have been scheduled correctly.");

  // Trigger update, clock set for experiment 2 to stop.

  now = futureDate(startDate2, 10 * MS_IN_ONE_DAY + 1000);
  gTimerScheduleOffset = -1;
  defineNow(gPolicy, now);
  experiments.notify();
  yield experiments._pendingTasksDone();
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 2, "Experiment list should have 2 entries now.");

  experimentListData[0].active = false;
  experimentListData[0].endDate = now.getTime();
  for (let i=0; i<experimentListData.length; ++i) {
    let entry = experimentListData[i];
    for (let k of Object.keys(entry)) {
      Assert.equal(entry[k], list[i][k],
                   "Entry " + i + " - Property '" + k + "' should match reference data.");
    }
  }

  // Cleanup.

  Services.obs.removeObserver(observer, OBSERVER_TOPIC);
  yield experiments.uninit();
});

// Test explicitly disabling experiments.

add_task(function* test_disableExperiment() {
  // Dates this test is based on.

  let startDate = new Date(2004, 10, 9, 12);
  let endDate   = futureDate(startDate, 100 * MS_IN_ONE_DAY);

  // The manifest data we test with.

  gManifestObject = {
    "version": 1,
    experiments: [
      {
        id:               EXPERIMENT1_ID,
        xpiURL:           gDataRoot + EXPERIMENT1_XPI_NAME,
        xpiHash:          EXPERIMENT1_XPI_SHA1,
        startTime:        dateToSeconds(startDate),
        endTime:          dateToSeconds(endDate),
        maxActiveSeconds: 10 * SEC_IN_ONE_DAY,
        appName:          ["XPCShell"],
        channel:          ["nightly"],
      },
    ],
  };

  // Data to compare the result of Experiments.getExperiments() against.

  let experimentInfo = {
    id: EXPERIMENT1_ID,
    name: "Test experiment 1",
    description: "Yet another experiment that experiments experimentally.",
  };

  let experiments = new Experiments.Experiments(gPolicy);

  // Trigger update, clock set for the experiment to start.

  let now = futureDate(startDate, 5 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  yield experiments.updateManifest();

  let list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry now.");

  experimentInfo.active = true;
  experimentInfo.endDate = now.getTime() + 10 * MS_IN_ONE_DAY;
  for (let k of Object.keys(experimentInfo)) {
    Assert.equal(experimentInfo[k], list[0][k],
                 "Property " + k + " should match reference data.");
  }

  // Test disabling the experiment.

  now = futureDate(now, 1 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  yield experiments.disableExperiment(EXPERIMENT1_ID);

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry.");

  experimentInfo.active = false;
  experimentInfo.endDate = now.getTime();
  for (let k of Object.keys(experimentInfo)) {
    Assert.equal(experimentInfo[k], list[0][k],
                 "Property " + k + " should match reference data.");
  }

  // Test that updating the list doesn't re-enable it.

  now = futureDate(now, 1 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  yield experiments.updateManifest();

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry.");

  for (let k of Object.keys(experimentInfo)) {
    Assert.equal(experimentInfo[k], list[0][k],
                 "Property " + k + " should match reference data.");
  }

  // Cleanup.

  yield experiments.uninit();
});

add_task(function* test_disableExperimentsFeature() {
  // Dates this test is based on.

  let startDate = new Date(2004, 10, 9, 12);
  let endDate   = futureDate(startDate, 100 * MS_IN_ONE_DAY);

  // The manifest data we test with.

  gManifestObject = {
    "version": 1,
    experiments: [
      {
        id:               EXPERIMENT1_ID,
        xpiURL:           gDataRoot + EXPERIMENT1_XPI_NAME,
        xpiHash:          EXPERIMENT1_XPI_SHA1,
        startTime:        dateToSeconds(startDate),
        endTime:          dateToSeconds(endDate),
        maxActiveSeconds: 10 * SEC_IN_ONE_DAY,
        appName:          ["XPCShell"],
        channel:          ["nightly"],
      },
    ],
  };

  // Data to compare the result of Experiments.getExperiments() against.

  let experimentInfo = {
    id: EXPERIMENT1_ID,
    name: "Test experiment 1",
    description: "Yet another experiment that experiments experimentally.",
  };

  let experiments = new Experiments.Experiments(gPolicy);
  Assert.equal(experiments.enabled, true, "Experiments feature should be enabled.");

  // Trigger update, clock set for the experiment to start.

  let now = futureDate(startDate, 5 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  yield experiments.updateManifest();

  let list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry now.");

  experimentInfo.active = true;
  experimentInfo.endDate = now.getTime() + 10 * MS_IN_ONE_DAY;
  for (let k of Object.keys(experimentInfo)) {
    Assert.equal(experimentInfo[k], list[0][k],
                 "Property " + k + " should match reference data.");
  }

  // Test disabling experiments.

  yield experiments._toggleExperimentsEnabled(false);
  Assert.equal(experiments.enabled, false, "Experiments feature should be disabled now.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry.");

  experimentInfo.active = false;
  experimentInfo.endDate = now.getTime();
  for (let k of Object.keys(experimentInfo)) {
    Assert.equal(experimentInfo[k], list[0][k],
                 "Property " + k + " should match reference data.");
  }

  // Test that updating the list doesn't re-enable it.

  now = futureDate(now, 1 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  try {
    yield experiments.updateManifest();
  } catch (e) {
    // Exception expected, the feature is disabled.
  }

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry.");

  for (let k of Object.keys(experimentInfo)) {
    Assert.equal(experimentInfo[k], list[0][k],
                 "Property " + k + " should match reference data.");
  }

  // Cleanup.

  yield experiments.uninit();
});

// Test that after a failed experiment install:
// * the next applicable experiment gets installed
// * changing the experiments data later triggers re-evaluation

add_task(function* test_installFailure() {
  const OBSERVER_TOPIC = "experiments-changed";
  let observerFireCount = 0;
  let expectedObserverFireCount = 0;
  let observer = () => ++observerFireCount;
  Services.obs.addObserver(observer, OBSERVER_TOPIC, false);

  // Dates the following tests are based on.

  let baseDate   = new Date(2014, 5, 1, 12);
  let startDate = futureDate(baseDate,   100 * MS_IN_ONE_DAY);
  let endDate   = futureDate(baseDate, 10000 * MS_IN_ONE_DAY);

  // The manifest data we test with.

  gManifestObject = {
    "version": 1,
    experiments: [
      {
        id:               EXPERIMENT1_ID,
        xpiURL:           gDataRoot + EXPERIMENT1_XPI_NAME,
        xpiHash:          EXPERIMENT1_XPI_SHA1,
        startTime:        dateToSeconds(startDate),
        endTime:          dateToSeconds(endDate),
        maxActiveSeconds: 10 * SEC_IN_ONE_DAY,
        appName:          ["XPCShell"],
        channel:          ["nightly"],
      },
      {
        id:               EXPERIMENT2_ID,
        xpiURL:           gDataRoot + EXPERIMENT2_XPI_NAME,
        xpiHash:          EXPERIMENT2_XPI_SHA1,
        startTime:        dateToSeconds(startDate),
        endTime:          dateToSeconds(endDate),
        maxActiveSeconds: 10 * SEC_IN_ONE_DAY,
        appName:          ["XPCShell"],
        channel:          ["nightly"],
      },
    ],
  };

  // Data to compare the result of Experiments.getExperiments() against.

  let experimentListData = [
    {
      id: EXPERIMENT1_ID,
      name: "Test experiment 1",
      description: "Yet another experiment that experiments experimentally.",
    },
    {
      id: EXPERIMENT2_ID,
      name: "Test experiment 2",
      description: "And yet another experiment that experiments experimentally.",
    },
  ];

  let experiments = new Experiments.Experiments(gPolicy);

  // Trigger update, clock set to before any activation.

  let now = baseDate;
  defineNow(gPolicy, now);
  yield experiments.updateManifest();
  Assert.equal(observerFireCount, 0,
               "Experiments observer should not have been called yet.");
  let list = yield experiments.getExperiments();
  Assert.equal(list.length, 0, "Experiment list should be empty.");

  // Trigger update, clock set for experiment 1 & 2 to start,
  // invalid hash for experiment 1.
  // Order in the manifest matters, so we should start experiment 1,
  // fail to install it & start experiment 2 instead.

  now = futureDate(startDate, 10 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  gManifestObject.experiments[0].xpiHash = "sha1:0000000000000000000000000000000000000000";
  yield experiments.updateManifest();
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry now.");
  Assert.equal(list[0].id, EXPERIMENT2_ID, "Experiment 2 should be the sole entry.");
  Assert.equal(list[0].active, true, "Experiment 2 should be active.");

  // Trigger update, clock set for experiment 2 to stop.

  now = futureDate(now, 20 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  yield experiments.updateManifest();
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  experimentListData[0].active = false;
  experimentListData[0].endDate = now;

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry now.");
  Assert.equal(list[0].id, EXPERIMENT2_ID, "Experiment 2 should be the sole entry.");
  Assert.equal(list[0].active, false, "Experiment should not be active.");

  // Trigger update with a fixed entry for experiment 1,
  // which should get re-evaluated & started now.

  now = futureDate(now, 20 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  gManifestObject.experiments[0].xpiHash = EXPERIMENT1_XPI_SHA1;
  yield experiments.updateManifest();
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  experimentListData[0].active = true;
  experimentListData[0].endDate = now.getTime() + 10 * MS_IN_ONE_DAY;

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 2, "Experiment list should have 2 entries now.");

  for (let i=0; i<experimentListData.length; ++i) {
    let entry = experimentListData[i];
    for (let k of Object.keys(entry)) {
      Assert.equal(entry[k], list[i][k],
                   "Entry " + i + " - Property '" + k + "' should match reference data.");
    }
  }

  // Cleanup.

  Services.obs.removeObserver(observer, OBSERVER_TOPIC);
  yield experiments.uninit();
});

// Test that after an experiment was disabled by user action,
// the experiment is not activated again if manifest data changes.

add_task(function* test_userDisabledAndUpdated() {
  const OBSERVER_TOPIC = "experiments-changed";
  let observerFireCount = 0;
  let expectedObserverFireCount = 0;
  let observer = () => ++observerFireCount;
  Services.obs.addObserver(observer, OBSERVER_TOPIC, false);

  // Dates the following tests are based on.

  let baseDate   = new Date(2014, 5, 1, 12);
  let startDate = futureDate(baseDate,   100 * MS_IN_ONE_DAY);
  let endDate   = futureDate(baseDate, 10000 * MS_IN_ONE_DAY);

  // The manifest data we test with.

  gManifestObject = {
    "version": 1,
    experiments: [
      {
        id:               EXPERIMENT1_ID,
        xpiURL:           gDataRoot + EXPERIMENT1_XPI_NAME,
        xpiHash:          EXPERIMENT1_XPI_SHA1,
        startTime:        dateToSeconds(startDate),
        endTime:          dateToSeconds(endDate),
        maxActiveSeconds: 10 * SEC_IN_ONE_DAY,
        appName:          ["XPCShell"],
        channel:          ["nightly"],
      },
    ],
  };

  let experiments = new Experiments.Experiments(gPolicy);

  // Trigger update, clock set to before any activation.

  let now = baseDate;
  defineNow(gPolicy, now);
  yield experiments.updateManifest();
  Assert.equal(observerFireCount, 0,
               "Experiments observer should not have been called yet.");
  let list = yield experiments.getExperiments();
  Assert.equal(list.length, 0, "Experiment list should be empty.");

  // Trigger update, clock set for experiment 1 to start.

  now = futureDate(startDate, 10 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  yield experiments.updateManifest();
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry now.");
  Assert.equal(list[0].id, EXPERIMENT1_ID, "Experiment 1 should be the sole entry.");
  Assert.equal(list[0].active, true, "Experiment 1 should be active.");

  // Explicitly disable an experiment.

  now = futureDate(now, 20 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  yield experiments.disableExperiment(EXPERIMENT1_ID);
  Assert.equal(observerFireCount, ++expectedObserverFireCount,
               "Experiments observer should have been called.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry now.");
  Assert.equal(list[0].id, EXPERIMENT1_ID, "Experiment 1 should be the sole entry.");
  Assert.equal(list[0].active, false, "Experiment should not be active anymore.");

  // Trigger an update with a faked change for experiment 1.

  now = futureDate(now, 20 * MS_IN_ONE_DAY);
  defineNow(gPolicy, now);
  experiments._experiments.get(EXPERIMENT1_ID)._manifestData.xpiHash =
    "sha1:0000000000000000000000000000000000000000";
  yield experiments.updateManifest();
  Assert.equal(observerFireCount, expectedObserverFireCount,
               "Experiments observer should not have been called.");

  list = yield experiments.getExperiments();
  Assert.equal(list.length, 1, "Experiment list should have 1 entry now.");
  Assert.equal(list[0].id, EXPERIMENT1_ID, "Experiment 1 should be the sole entry.");
  Assert.equal(list[0].active, false, "Experiment should still be inactive.");

  // Cleanup.

  Services.obs.removeObserver(observer, OBSERVER_TOPIC);
  yield experiments.uninit();
});

add_task(function* shutdown() {
  yield gReporter._shutdown();
});
