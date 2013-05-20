Ext.define('BibleTreeFilterModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'nodeKey',  type: 'string'},
        {name: 'nodeText',   type: 'string'}
     ]
});

Ext.define('Optima5.Modules.CrmBase.BibleTreeFilter', {
    extend: 'Ext.ux.grid.filter.Filter',
    alias: 'gridfilter.op5crmbasebibletree',

    requires: ['Ext.selection.CheckboxModel'] ,

    /**
     * @cfg {String} iconCls
     * The iconCls to be applied to the menu item.
     * Defaults to <tt>'ux-gridfilter-text-icon'</tt>.
     */
    iconCls : 'ux-gridfilter-text-icon',

    emptyText: 'Enter Filter Text...',
    selectOnFocus: true,
    width: 300,
			  
	inputValue: [],

	/**
	* @private
	* Template method that is to initialize the filter and install required menu items.
	*/
	init : function (config) {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:BibleTreeFilter','No module reference ?') ;
		}
		
		Ext.applyIf(config, {
			enableKeyEvents: true,
			iconCls: this.iconCls,
			hideLabel: true,
			listeners: {
				scope: this,
				keyup: this.onInputKeyUp,
				el: {
					click: function(e) {
							e.stopPropagation();
					}
				}
			}
		});
		
		this.updateTask = Ext.create('Ext.util.DelayedTask', this.fireUpdate, this);
		  
		  
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action : 'data_getBibleTreeOne',
				bible_code : this.bibleId
			},
			success: function(response) {
				if( Ext.decode(response.responseText).success == true ) {
					// this.bibleId = bibleId ;
					this.initSetupTree( Ext.decode(response.responseText).dataRoot ) ;
				}
				else {
					this.bibleId = '' ;
				}
			},
			scope: this
		});
		  
    },
			  
	initSetupTree: function( dataRoot ) {
		var me = this ;
		
		this.mystore = Ext.create('Ext.data.TreeStore', {
			model: 'BibleTreeFilterModel',
			root: dataRoot 
		});
		
		var width = 200 ;
		if( this.width )
			width = this.width ;
		  
		var height = 150 ;
		if( this.height )
			height = this.height ;
		if( this.autoHeight ) {
			var cntStore = 0 ;
			this.mystore.getRootNode().cascadeBy(function(){
				cntStore++ ;
			},this) ;
			if( (cntStore * 25) < height )
				height=(cntStore * 25) ;
			if( height < 50 )
				height = 50 ;
		}
		
		this.inputItem = Ext.create('Ext.tree.Panel', {
			store: this.mystore ,
			displayField: 'nodeText',
			rootVisible: true,
			useArrows: true,
			width: width,
			height: height
		}) ;
		this.inputItem.getView().on('checkchange',function(rec,check){
			rec.cascadeBy(function(chrec){
				chrec.set('checked',check) ;
			},this);
			if( !check ) {
				var upRecord = rec ;
				while( upRecord.parentNode ) {
					upRecord.parentNode.set('checked',check) ;
					upRecord = upRecord.parentNode
				}
			}
			me.onCheckChange() ;
		},this) ;
		
		this.menu.add(this.inputItem);
		
		me.menu.on('beforeshow',function(){
			me.onMenuBeforeShow() ;
		},me) ;
		me.menu.on('hide',function(){
			me.onMenuHide() ;
		},me) ;
	},
			  
	onCheckChange: function(){
		var me = this ;
		
		var checkedKeys = new Array() ;
		if( this.mystore ) {
			this.mystore.getRootNode().cascadeBy(function(rec){
				if( rec.get('checked') == true ) {
					checkedKeys.push( rec.get('nodeKey') ) ;
					//return false ;
				}
			},this) ;
		}
		me.inputValue = checkedKeys ;
		
		me.fireUpdate() ;
	},
	isActivatable : function () {
		return this.getValue().length > 0;
	},
	getSerialArgs : function () {
		var me = this ;
		return {type: 'list', value: this.phpMode ? me.getValue().join(',') : me.getValue()};
	},
	getValue : function() {
		var me = this ;
		return me.inputValue ;
	},
	setValue : function(value) {
		var me = this ;
		
		// Load de la valeur
		value = me.inputValue = [].concat(value);
		this.fireEvent('update', this);
	},
			  
	onMenuBeforeShow: function() {
		var me = this ;
		
	},
	onMenuHide: function() {
		var me = this ;
		
	}


});