/**
@module ember
@submodule ember-metal
*/

// BEGIN IMPORTS
import require, { has } from 'require';
import { ENV, context } from 'ember-environment';
import VERSION from 'ember/version';
import Ember from './core'; // reexports
import { deprecate, deprecateFunc } from './debug';
import isEnabled, { FEATURES } from './features';
import assign from './assign';
import merge from './merge';
import {
  instrument,
  reset as instrumentationReset,
  subscribe as instrumentationSubscribe,
  unsubscribe as instrumentationUnsubscribe
} from './instrumentation';
import {
  GUID_KEY,
  apply,
  applyStr,
  canInvoke,
  generateGuid,
  guidFor,
  inspect,
  makeArray,
  deprecatedTryCatchFinally,
  tryInvoke,
  uuid,
  wrap
} from './utils';
import {
  META_DESC,
  meta
} from './meta';
import EmberError from './error';
import Cache from './cache';
import Logger from 'ember-console';

import {
  _getPath,
  get,
  getWithDefault
} from './property_get';

import {
  accumulateListeners,
  addListener,
  hasListeners,
  listenersFor,
  on,
  removeListener,
  sendEvent,
  suspendListener,
  suspendListeners,
  watchedEvents
} from './events';

import ObserverSet from './observer_set';

import {
  beginPropertyChanges,
  changeProperties,
  endPropertyChanges,
  overrideChains,
  propertyDidChange,
  propertyWillChange
} from './property_events';

import {
  defineProperty
} from './properties';
import {
  set,
  trySet
} from './property_set';

import WeakMap from './weak_map';
import {
  Map,
  MapWithDefault,
  OrderedSet
} from './map';

import getProperties from './get_properties';
import setProperties from './set_properties';
import {
  watchKey,
  unwatchKey
} from './watch_key';
import {
  ChainNode,
  finishChains,
  removeChainWatcher
} from './chains';
import {
  watchPath,
  unwatchPath
} from './watch_path';
import {
  destroy,
  isWatching,
  rewatch,
  unwatch,
  watch
} from './watching';
import expandProperties from './expand_properties';
import {
  ComputedProperty,
  computed,
  cacheFor
} from './computed';

import alias from './alias';

computed.alias = alias;

import {
  _suspendObserver,
  _suspendObservers,
  addObserver,
  observersFor,
  removeObserver
} from './observer';
import {
  NAME_KEY,
  Mixin,
  aliasMethod,
  _immediateObserver,
  mixin,
  observer,
  required
} from './mixin';
import {
  Binding,
  bind
} from './binding';
import {
  isGlobalPath
} from './path_cache';

import {
  isTesting,
  setTesting
} from './testing';
import {
  getOnerror,
  setOnerror
} from './error_handler';

import run from './run_loop';
import libraries from './libraries';
import isNone from './is_none';
import isEmpty from './is_empty';
import isBlank from './is_blank';
import isPresent from './is_present';
import Backburner from 'backburner';

// END IMPORTS

// BEGIN EXPORTS
const EmberInstrumentation = Ember.Instrumentation = {};
EmberInstrumentation.instrument = instrument;
EmberInstrumentation.subscribe = instrumentationSubscribe;
EmberInstrumentation.unsubscribe = instrumentationUnsubscribe;
EmberInstrumentation.reset  = instrumentationReset;

Ember.instrument = instrument;
Ember.subscribe = instrumentationSubscribe;

Ember._Cache = Cache;

Ember.generateGuid    = generateGuid;
Ember.GUID_KEY        = GUID_KEY;
Ember.NAME_KEY        = NAME_KEY;
Ember.platform        = {
  defineProperty: true,
  hasPropertyAccessors: true
};

Ember.Error           = EmberError;
Ember.guidFor         = guidFor;
Ember.META_DESC       = META_DESC;
Ember.meta            = meta;
Ember.inspect         = inspect;

Ember.tryCatchFinally = deprecatedTryCatchFinally;
Ember.makeArray       = makeArray;
Ember.canInvoke       = canInvoke;
Ember.tryInvoke       = tryInvoke;
Ember.wrap            = wrap;
Ember.apply           = apply;
Ember.applyStr        = applyStr;
Ember.uuid            = uuid;

Ember.Logger = Logger;

Ember.get            = get;
Ember.getWithDefault = getWithDefault;
Ember._getPath       = _getPath;

Ember.on                  = on;
Ember.addListener         = addListener;
Ember.removeListener      = removeListener;
Ember._suspendListener    = suspendListener;
Ember._suspendListeners   = suspendListeners;
Ember.sendEvent           = sendEvent;
Ember.hasListeners        = hasListeners;
Ember.watchedEvents       = watchedEvents;
Ember.listenersFor        = listenersFor;
Ember.accumulateListeners = accumulateListeners;

Ember._ObserverSet = ObserverSet;

Ember.propertyWillChange = propertyWillChange;
Ember.propertyDidChange = propertyDidChange;
Ember.overrideChains = overrideChains;
Ember.beginPropertyChanges = beginPropertyChanges;
Ember.endPropertyChanges = endPropertyChanges;
Ember.changeProperties = changeProperties;

Ember.defineProperty = defineProperty;

Ember.set    = set;
Ember.trySet = trySet;

if (isEnabled('ember-metal-weakmap')) {
  Ember.WeakMap = WeakMap;
}
Ember.OrderedSet = OrderedSet;
Ember.Map = Map;
Ember.MapWithDefault = MapWithDefault;

Ember.getProperties = getProperties;
Ember.setProperties = setProperties;

Ember.watchKey   = watchKey;
Ember.unwatchKey = unwatchKey;

Ember.removeChainWatcher = removeChainWatcher;
Ember._ChainNode = ChainNode;
Ember.finishChains = finishChains;

Ember.watchPath = watchPath;
Ember.unwatchPath = unwatchPath;

Ember.watch = watch;
Ember.isWatching = isWatching;
Ember.unwatch = unwatch;
Ember.rewatch = rewatch;
Ember.destroy = destroy;

Ember.expandProperties = expandProperties;

Ember.ComputedProperty = ComputedProperty;
Ember.computed = computed;
Ember.cacheFor = cacheFor;

Ember.addObserver = addObserver;
Ember.observersFor = observersFor;
Ember.removeObserver = removeObserver;
Ember._suspendObserver = _suspendObserver;
Ember._suspendObservers = _suspendObservers;

Ember.required = required;
Ember.aliasMethod = aliasMethod;
Ember.observer = observer;
Ember.immediateObserver = _immediateObserver;
Ember.mixin = mixin;
Ember.Mixin = Mixin;

Ember.bind = bind;
Ember.Binding = Binding;
Ember.isGlobalPath = isGlobalPath;

Ember.run = run;

/**
@class Backburner
@for Ember
@private
*/
Ember.Backburner = function() {
  deprecate(
    'Usage of Ember.Backburner is deprecated.',
    false,
    {
      id: 'ember-metal.ember-backburner',
      until: '2.8.0',
      url: 'http://emberjs.com/deprecations/v2.x/#toc_ember-backburner'
    }
  );

  function BackburnerAlias(args) {
    return Backburner.apply(this, args);
  }

  BackburnerAlias.prototype = Backburner.prototype;

  return new BackburnerAlias(arguments);
};

Ember._Backburner = Backburner;

/**
  The semantic version
  @property VERSION
  @type String
  @public
 */
Ember.VERSION = VERSION;

Ember.libraries = libraries;

libraries.registerCoreLibrary('Ember', Ember.VERSION);

Ember.isNone = isNone;
Ember.isEmpty = isEmpty;
Ember.isBlank = isBlank;
Ember.isPresent = isPresent;

Ember.assign = Object.assign || assign;
Ember.merge = merge;

Ember.FEATURES = FEATURES;
Ember.FEATURES.isEnabled = isEnabled;

Ember.EXTEND_PROTOTYPES = ENV.EXTEND_PROTOTYPES;

// BACKWARDS COMPAT ACCESSORS FOR ENV FLAGS
Object.defineProperty(Ember, 'LOG_STACKTRACE_ON_DEPRECATION', {
  get()      { return ENV.LOG_STACKTRACE_ON_DEPRECATION;    },
  set(value) { ENV.LOG_STACKTRACE_ON_DEPRECATION = !!value; },
  enumerable: false
});

Object.defineProperty(Ember, 'LOG_VERSION', {
  get()      { return ENV.LOG_VERSION;   },
  set(value) { ENV.LOG_VERSION = !!value; },
  enumerable: false
});

Object.defineProperty(Ember, 'MODEL_FACTORY_INJECTIONS', {
  get()      { return ENV.MODEL_FACTORY_INJECTIONS;    },
  set(value) { ENV.MODEL_FACTORY_INJECTIONS = !!value;  },
  enumerable: false
});

Object.defineProperty(Ember, 'LOG_BINDINGS', {
  get()      { return ENV.LOG_BINDINGS;    },
  set(value) { ENV.LOG_BINDINGS = !!value; },
  enumerable: false
});

Object.defineProperty(Ember, 'ENV', {
  get() { return ENV; },
  enumerable: false
});

/**
  The context that Ember searches for namespace instances on.

  @private
 */
Object.defineProperty(Ember, 'lookup', {
  get()      { return context.lookup; },
  set(value) { context.lookup = value; },
  enumerable: false
});

Object.defineProperty(Ember, 'testing', {
  get: isTesting,
  set: setTesting,
  enumerable: false
});

/**
  A function may be assigned to `Ember.onerror` to be called when Ember
  internals encounter an error. This is useful for specialized error handling
  and reporting code.

  ```javascript
  Ember.onerror = function(error) {
    Em.$.ajax('/report-error', 'POST', {
      stack: error.stack,
      otherInformation: 'whatever app state you want to provide'
    });
  };
  ```

  Internally, `Ember.onerror` is used as Backburner's error handler.

  @event onerror
  @for Ember
  @param {Exception} error the error object
  @public
*/
Object.defineProperty(Ember, 'onerror', {
  get: getOnerror,
  set: setOnerror,
  enumerable: false
});

/**
  An empty function useful for some operations. Always returns `this`.

  @method K
  @return {Object}
  @public
*/
Ember.K = function K() { return this; };

// The debug functions are exported to globals with `require` to
// prevent babel-plugin-filter-imports from removing them.
let debugModule = require('ember-metal/debug');
Ember.assert = debugModule.assert;
Ember.warn = debugModule.warn;
Ember.debug = debugModule.debug;
Ember.deprecate = debugModule.deprecate;
Ember.deprecateFunc = debugModule.deprecateFunc;
Ember.runInDebug = debugModule.runInDebug;
// END EXPORTS

// do this for side-effects of updating Ember.assert, warn, etc when
// ember-debug is present
// This needs to be called before any deprecateFunc
if (has('ember-debug')) {
  require('ember-debug');
} else {
  Ember.Debug = { };
  Ember.Debug.registerDeprecationHandler = function() { };
  Ember.Debug.registerWarnHandler = function() { };
}

Ember.create = deprecateFunc('Ember.create is deprecated in favor of Object.create', { id: 'ember-metal.ember-create', until: '3.0.0' }, Object.create);
Ember.keys = deprecateFunc('Ember.keys is deprecated in favor of Object.keys', { id: 'ember-metal.ember.keys', until: '3.0.0' }, Object.keys);

/* globals module */
if (typeof module === 'object' && module.exports) {
  module.exports = Ember;
} else {
  context.exports.Ember = context.exports.Em = Ember;
}

export default Ember;
