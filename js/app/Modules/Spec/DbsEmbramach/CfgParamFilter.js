Ext.define('Optima5.Modules.Spec.DbsEmbramach.CfgParamFilter', {
	extend: 'Ext.grid.filters.filter.SingleFilter',
	alias: 'grid.filter.op5specdbsembramachcfgfilter',
	mixins: {
		observable: 'Ext.mixin.Observable'
	},

	requires: ['Optima5.Modules.Spec.DbsEmbramach.CfgParamTree'] ,

	/**
	* @cfg {String} iconCls
	* The iconCls to be applied to the menu item.
	* Defaults to <tt>'ux-gridfilter-text-icon'</tt>.
	*/
	iconCls : 'ux-gridfilter-text-icon',

	emptyText: 'Enter Filter Text...',
	selectOnFocus: true,
	
	operator: 'in',
	
	inputValue: [],
	

	/**
	* @private
	* Template method that is to initialize the filter and install required menu items.
	*/
	constructor : function (config) {
		var me = this ;
		this.callParent(arguments);
		this.mixins.observable.constructor.call(this, config);
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
	},
			  
	/**
	* @private
	* Template method that is to initialize the filter and install required menu items.
	*/
	createMenu: function() {
		var me = this ;
		this.callParent() ;
		
		var width = 400 ;
		if( this.width )
			width = this.width ;
		  
		var height = 250 ;
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
		
		this.cfgParamTree = Ext.create('Optima5.Modules.Spec.DbsEmbramach.CfgParamTree',{
			optimaModule: this.optimaModule,
			cfgParam_id: this.cfgParam_id,
			width:250,
			height:300,
			listeners: {
				change: {
					fn: function(){
						this.onChange() ;
					},
					scope: this
				},
				load: {
					fn: this.onAfterLoad,
					scope: this
				}
			}
		});
		
		me.menu.add(this.cfgParamTree) ;
		me.menu.on('beforeshow',function(){
			me.onMenuBeforeShow() ;
		},me) ;
		me.menu.on('hide',function(){
			me.onMenuHide() ;
		},me) ;
	},
	activateMenu: Ext.emptyFn,
			  
	onChange: function() {
		var me = this ;
		var cfgParamTree = this.cfgParamTree,
			selectedValues = cfgParamTree.getLeafNodesKey() ;
			
		var checkedKeys = (Ext.isEmpty(cfgParamTree.getValue()) ? [] : selectedValues) ;
			
		this.filter.setValue(checkedKeys);
		this.fireEvent('update',me) ;
		
		var hasRecords = (checkedKeys.length > 0) ;
		if( hasRecords && me.active ) {
			me.updateStoreFilter();
		} else {
			me.setActive( checkedKeys.length > 0 ) ;
		}
	},
	
	getValue : function() {
		var me = this ;
		return me.inputValue ;
	},
	setValue : function(value) {
		var me = this ;
		
		// Load de la valeur
		value = me.inputValue = [].concat(value);
		// TODO: setup filter list
	},
			  
	onMenuBeforeShow: function() {
		var me = this ;
	},
	onMenuHide: function() {
		var me = this ;
	}
});
