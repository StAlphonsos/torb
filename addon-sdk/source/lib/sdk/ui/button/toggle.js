/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */
'use strict';

module.metadata = {
  'stability': 'experimental',
  'engines': {
    'Firefox': '> 28'
  }
};

const { Class } = require('../../core/heritage');
const { merge } = require('../../util/object');
const { Disposable } = require('../../core/disposable');
const { on, off, emit, setListeners } = require('../../event/core');
const { EventTarget } = require('../../event/target');

const view = require('./view');
const { toggleButtonContract, toggleStateContract } = require('./contract');
const { properties, render, state, register, unregister } = require('../state');
const { events: stateEvents } = require('../state/events');
const { events: viewEvents } = require('./view/events');
const events = require('../../event/utils');

const buttons = new Map();

const ToggleButton = Class({
  extends: EventTarget,
  implements: [
    properties(toggleStateContract),
    state(toggleStateContract),
    Disposable
  ],
  setup: function setup(options) {
    let state = merge({
      disabled: false,
      checked: false
    }, toggleButtonContract(options));

    register(this, state);

    // Setup listeners.
    setListeners(this, options);

    buttons.set(options.id, this);

    view.create(merge({ type: 'checkbox' }, state));
  },

  dispose: function dispose() {
    buttons.delete(this.id);

    off(this);

    view.dispose(this.id);

    unregister(this);
  },

  get id() this.state().id,

  click: function click() view.click(this.id)
});
exports.ToggleButton = ToggleButton;

let toggleButtonStateEvents = events.filter(stateEvents,
  e => e.target instanceof ToggleButton);

let toggleButtonViewEvents = events.filter(viewEvents,
  e => buttons.has(e.target));

let clickEvents = events.filter(toggleButtonViewEvents, e => e.type === 'click');
let updateEvents = events.filter(toggleButtonViewEvents, e => e.type === 'update');

on(toggleButtonStateEvents, 'data', ({target, window, state}) => {
  let { id } = target;
  view.setIcon(id, window, state.icon);
  view.setLabel(id, window, state.label);
  view.setDisabled(id, window, state.disabled);
  view.setChecked(id, window, state.checked);
});

on(clickEvents, 'data', ({target: id, window}) => {
  let button = buttons.get(id);
  let state = button.state('tab');

  state = merge({}, state, { checked: !state.checked });

  button.state('tab', state);

  emit(button, 'click', state);

  emit(button, 'change', state);
});

on(updateEvents, 'data', ({target: id, window}) => {
  render(buttons.get(id), window);
});
