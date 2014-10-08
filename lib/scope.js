

//umd pattern

(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        //commonjs

        module.exports = factory(require('elliptical-platform'));
    } else if (typeof define === 'function' && define.amd) {
        // AMD. Register as an anonymous module.
        define(['elliptical-platform'], factory);
    } else {
        // Browser globals (root is window)
        root.returnExports = factory($);
    }
}(this, function ($) {
    var utils= $.elliptical.utils;
    var _=utils._;

    //if Object.observe not natively supported,start dirty checking

    if(!$.elliptical.hasObjectObserve){
        $.elliptical.startDirtyCheck();
    }


    $.element('elliptical.scope',{

        options:{
            idProp:'id',
            dataBind:true
        },

        /**
         *
         * @private
         */
        _initElement:function(){
            this._data._timeOutId=null;
            this._data.scopeObserver=null;
            this._data.scopeId=this.options.idProp;
            this._data._discard=false;
            this.__initScope();

            if(this.options.dataBind){
                this.__initScopeObservable();
            }

        },

        /**
         * init a $scope on the instance
         * @private
         */
        __initScope:function(){
            this.$scope={};

        },

        /**
         * init a watcher that binds an observable to the $scope when it becomes non-empty
         * terminates itself when it calls _setObservable
         * the init watcher avoids the initial $scope setting by the developer firing a change event
         * since an inherited parent's _initElement event is sequentially is going to fire before the element's _initElement
         * @private
         */
        __initScopeObservable:function(){
            var self=this;
            this._data._timeOutId=setInterval(function(){
                if(!_.isEmpty(self.$scope)){
                    clearInterval(self._data._timeOutId);
                    self.__setObservable();
                    self._onScopeInit(self.__cloneScope());

                }
            },500);
        },

        /**
         * set the observable
         * @private
         */
        __setObservable:function(){
            var $scope=this.$scope;
            var self=this;
            var id=this.options.idProp;
            if(id===undefined){
                id='id';
            }

            var observer = new ObjectObserver($scope,id);
            observer.open(function(result){
                self.__onScopeChange(result);
            });
            /* save reference to the observer instance */
            this._data.scopeObserver=observer;

        },

        /**
         * destroy the scope observable
         * @private
         */
        __destroyObservable:function(){
            if(this._data.scopeObserver){
                this._data.scopeObserver.close();
                this._data.scopeObserver=null;
                this.$scope=null;
            }
        },

        /**
         * reset observable
         * @private
         */
        __resetObservable: function(){
            this.__destroyObservable();
            this.__setObservable();
        },

        /**
         * clone the scope object...changes to this will not effect observable
         * @returns {Object}
         * @private
         */
        __cloneScope:function(){
            return _.cloneDeep(this.$scope);

        },

        /**
         * clone an object
         * @param obj {Object}
         * @returns {Object}
         * @private
         */
        __cloneObject:function(obj){
            return _.cloneDeep(obj);
        },

        /**
         * returns scope length...(-1)==object, not array
         * @returns {Number}
         * @controller
         */
        __scopeLength:function(obj){
            var scope=(typeof obj==='undefined') ? this.$scope : obj;
            if(utils.isPropertyByIndexArray(scope,0)){
                var arr=utils.objectPropertyByIndex(scope,0);
                return arr.length;
            }else{
                return -1;  //object
            }
        },

        /**
         *
         * @private
         */
        __isModelList:function(){
            return (this.__scopeLength() > -1);
        },

        /**
         *
         * @param val {Object}
         * @private
         */
        _removeFromModelListById: function(val){
            var scope=this.$scope;
            var id=this._data.scopeId;
            utils.deleteObjectByIdFromArrayProp(scope,id,val);
        },

        /**
         *
         * @param val {Object}
         * @returns {Object}
         * @private
         *
         */
        _selectFromModelListById: function(val){
            var scope=this.$scope;
            var id=this._data.scopeId;
            if(id===undefined){
                id='id';
            }
            return utils.selectObjectByIdFromArrayProp(scope,id,val);

        },

        /**
         *
         * @param obj {Object}
         * @returns {Object}
         * @private
         */
        _selectFromModelListByObj:function(obj){
            var __o;
            var items=this.$scope[Object.keys(this._scope)[0]];
            items.forEach(function(o){
                if(_.isEqual(obj,o)){
                    __o=o;
                }
            });

            return __o;
        },

        _scopeIndexById:function(id){
            var idProp=this._data.scopeId;
            if(idProp===undefined){
                idProp='id';
            }
            return utils.objectIndexById(this.$scope,id,idProp);
        },

        /**
         * recycles the observable
         * @private
         */
        __recycle:function(){
            this.__destroyObservable();
            this.__setObservable();
        },

        /**
         * clears the watcher(that only sets up the observable).
         * as soon as a $scope has a non-empty value, the watcher terminates itself
         * @private
         */
        __clearWatch: function(){
            if(this._data.timeOutId){
                clearInterval(self._data._timeOutId);
            }
        },

        /**
         * hook for scope observable change
         *
         * @param result {Object}
         * @controller
         */
        __onScopeChange:function(result){
            if(!this._data._discard){
                this._onScopeChange(result);
            }

        },

        /**
         * console.log the current $scope
         * @param delay
         * @private
         */
        __printScope:function(delay){
            if(delay===undefined){
                delay=0;
            }
            var self=this;
            setTimeout(function(){
                console.log(self.$scope);
            },delay);

        },

        /**
         * returns changed object properties from the result param in _onScopeChange
         * @param obj
         * @returns {Object}
         * @private
         */
        _objectChange:function(obj){
            if(obj !==undefined){
                if(obj.object && obj.oldObject){
                    return utils.objChangedProps(obj.object,obj.oldObject);
                }else{
                    var chg_={};
                    chg_[obj.name]=obj.value;
                    return chg_;
                }
            }

        },


        /**
         * destroy clean-up
         * @private
         */
        _dispose:function(){
            this.__clearWatch();
            this.__destroyObservable();
        },

        _onScopeInit: $.noop,

        _onScopeChange: $.noop,

        /**
         * gives the difference between two objects
         * @param n {Object}
         * @param o {Object}
         * @returns {Object}
         * @public
         */
        $changeReport:function(n,o){
            return utils.objChangedProps(n,o);
        }

    });

    return $;


}));