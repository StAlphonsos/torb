/* -*- Mode: c++; c-basic-offset: 2; indent-tabs-mode: nil; tab-width: 40 -*- */
/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

#include "Navigator.h"

#include "mozilla/dom/WorkerNavigatorBinding.h"

#include "RuntimeService.h"
#include "WorkerPrivate.h"

BEGIN_WORKERS_NAMESPACE

NS_IMPL_CYCLE_COLLECTION_WRAPPERCACHE_0(WorkerNavigator)

NS_IMPL_CYCLE_COLLECTION_ROOT_NATIVE(WorkerNavigator, AddRef)
NS_IMPL_CYCLE_COLLECTION_UNROOT_NATIVE(WorkerNavigator, Release)

/* static */ already_AddRefed<WorkerNavigator>
WorkerNavigator::Create(bool aOnLine)
{
  RuntimeService* rts = RuntimeService::GetService();
  MOZ_ASSERT(rts);

  const RuntimeService::NavigatorProperties& properties =
    rts->GetNavigatorProperties();

  nsRefPtr<WorkerNavigator> navigator =
    new WorkerNavigator(properties, aOnLine);

  return navigator.forget();
}

JSObject*
WorkerNavigator::WrapObject(JSContext* aCx)
{
  return WorkerNavigatorBinding_workers::Wrap(aCx, this);
}

void
WorkerNavigator::GetAppName(nsString& aAppName) const
{
  WorkerPrivate* workerPrivate = GetCurrentThreadWorkerPrivate();
  MOZ_ASSERT(workerPrivate);

  if (!mProperties.mAppNameOverridden.IsEmpty() &&
      !workerPrivate->UsesSystemPrincipal()) {
    aAppName = mProperties.mAppNameOverridden;
  } else {
    aAppName = mProperties.mAppName;
  }
}

void
WorkerNavigator::GetAppVersion(nsString& aAppVersion) const
{
  WorkerPrivate* workerPrivate = GetCurrentThreadWorkerPrivate();
  MOZ_ASSERT(workerPrivate);

  if (!mProperties.mAppVersionOverridden.IsEmpty() &&
      !workerPrivate->UsesSystemPrincipal()) {
    aAppVersion = mProperties.mAppVersionOverridden;
  } else {
    aAppVersion = mProperties.mAppVersion;
  }
}

void
WorkerNavigator::GetPlatform(nsString& aPlatform) const
{
  WorkerPrivate* workerPrivate = GetCurrentThreadWorkerPrivate();
  MOZ_ASSERT(workerPrivate);

  if (!mProperties.mPlatformOverridden.IsEmpty() &&
      !workerPrivate->UsesSystemPrincipal()) {
    aPlatform = mProperties.mPlatformOverridden;
  } else {
    aPlatform = mProperties.mPlatform;
  }
}

END_WORKERS_NAMESPACE
