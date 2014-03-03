// Hoodie Config API
// ===================

var resolve = require('../utils/promise/resolve');

//
/**
 * Description
 * @method hoodieConfig
 * @param {} hoodie
 * @return
 */
function hoodieConfig(hoodie) {

  var type = '$config';
  var id = 'hoodie';
  var cache = {};

  // public API
  var config = {};


  // set
  // ----------

  // adds a configuration
  //
  /**
   * Description
   * @method set
   * @param {} key
   * @param {} value
   * @return CallExpression
   */
  config.set = function set(key, value) {
    var isSilent, update;

    if (cache[key] === value) {
      return;
    }

    cache[key] = value;

    update = {};
    update[key] = value;
    isSilent = key.charAt(0) === '_';

    // we have to assure that _hoodieId has always the
    // same value as createdBy for $config/hoodie
    // Also see config.js:77ff
    if (key === '_hoodieId') {
      hoodie.store.remove(type, id, {silent: true});
      update = cache;
    }

    return hoodie.store.updateOrAdd(type, id, update, {
      silent: isSilent
    });
  };

  // get
  // ----------

  // receives a configuration
  //
  /**
   * Description
   * @method get
   * @param {} key
   * @return MemberExpression
   */
  config.get = function get(key) {
    return cache[key];
  };

  // clear
  // ----------

  // clears cache and removes object from store
  //
  /**
   * Description
   * @method clear
   * @return CallExpression
   */
  config.clear = function clear() {
    cache = {};
    return hoodie.store.remove(type, id);
  };

  // unset
  // ----------

  // unsets a configuration. If configuration is present, calls
  // config.set(key, undefined). Otherwise resolves without store
  // interaction.
  //
  /**
   * Description
   * @method unset
   * @param {} key
   * @return CallExpression
   */
  config.unset = function unset(key) {
    if (typeof config.get(key) === 'undefined') {
      return resolve();
    }

    return config.set(key, undefined);
  };

  //
  // load current configuration from localStore.
  // The init method to be called on hoodie startup
  //
  /**
   * Description
   * @method init
   * @return
   */
  function init() {
    // TODO: I really don't like this being here. And I don't like that if the
    //       store API will be truly async one day, this will fall on our feet.
    //       We should discuss if we make config a simple object in localStorage,
    //       outside of hoodie.store, and use localStorage sync API directly to
    //       interact with it, also in future versions.
    hoodie.store.find(type, id).done(function(obj) {
      cache = obj;
    });
  }

  // allow to run init only once
  /**
   * Description
   * @method init
   * @return
   */
  config.init = function() {
    init();
    delete config.init;
  };

  //
  // subscribe to events coming from other modules
  //
  /**
   * Description
   * @method subscribeToOutsideEvents
   * @return
   */
  function subscribeToOutsideEvents() {
    hoodie.on('account:cleanup', config.clear);
  }

  // allow to run this once from outside
  /**
   * Description
   * @method subscribeToOutsideEvents
   * @return
   */
  config.subscribeToOutsideEvents = function() {
    subscribeToOutsideEvents();
    delete config.subscribeToOutsideEvents;
  };

  // exspose public API
  hoodie.config = config;
}

module.exports = hoodieConfig;

