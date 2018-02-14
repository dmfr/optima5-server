Ext.define('Ext.ux.grid.filters.filter.StringList', {
	extend: 'Ext.grid.filters.filter.SingleFilter',
	alias: 'grid.filter.stringlist',

	requires: ['Ext.selection.CheckboxModel'] ,

	/**
	* @cfg {String} iconCls
	* The iconCls to be applied to the menu item.
	* Defaults to <tt>'ux-gridfilter-text-icon'</tt>.
	*/
	iconCls : 'ux-gridfilter-text-icon',

	emptyText: 'Entrez le texte...',
	selectOnFocus: true,
	
	operator: 'in',
	useFilters: false,
	
	inputValue: [],

	constructor : function (config) {
		var me = this ;
		this.callParent(arguments);
		
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
		
		this.updateTask = Ext.create('Ext.util.DelayedTask', this.onTypeAhead, this);
		  
		this.initSetupStore() ;
	},
	 
	initSetupStore: function() {
		var me = this ;
		// me.inputEl.addCls('icon-bible-edit') ;
		//console.dir(me.divicon) ;
		//me.divicon.addCls('biblepicker-iconimg') ;
		// me.inputEl.dom.innerHTML = '<b>ijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsjijsiqjdodqsj</b>' ;
		
		var gridStore = this.getGridStore() ;
		gridStore.on('datachanged', this.onStoreDataChanged, this, {single:true}) ;
		
		this.myStore = Ext.create('Ext.data.Store', {
			fields: [{name:'string', type:'auto'}],
			data: [],
			sorters: [{
				property: 'string',
				direction: 'ASC'
			}]
		});
		
		
		me.myStore.on('load',function(){
		},me,{
			single:true
		}) ;
	},
	resetList: function() {
		var gridStore = this.getGridStore() ;
		gridStore.on('datachanged', this.onStoreDataChanged, this, {single:true}) ;
	},
	rebuildList: function() {
		var gridStore = this.getGridStore() ;
		this.onStoreDataChanged(gridStore) ;
	},
	onStoreDataChanged: function(gridStore) {
		var listStr = [],
			storeData = gridStore.getData().getSource() || gridStore.getData(),
			dataIndex = this.column.dataIndex ;
		if( !this.useFilters ) {
			storeData.each( function(rec) {
				if( !Ext.Array.contains( listStr, rec.data[dataIndex] ) ) {
					listStr.push(rec.data[dataIndex]) ;
				}
			}) ;
		} else {
			gridStore.each( function(rec) {
				if( !Ext.Array.contains( listStr, rec.data[dataIndex] ) ) {
					listStr.push(rec.data[dataIndex]) ;
				}
			}) ;
		}
		
		var records = [] ;
		Ext.Array.each( listStr, function(str) {
			records.push({
				string: str
			}) ;
		}) ;
		this.myStore.loadData(records) ;
	},
		
	/**
	* @private
	* Template method that is to initialize the filter and install required menu items.
	*/
	createMenu: function() {
		var me = this ;
		this.callParent() ;
		this.menu.add({
			xtype:'gridpanel',
			viewConfig: {
				loadMask: false
			},
			store: me.myStore,
			columns: [{
				text: this.column.text,
				dataIndex: 'string',
				menuDisabled: true,
				flex: 1
			}],
			height: 250,
			width:400,
			selModel: Ext.create('Ext.selection.CheckboxModel',{
				mode: 'MULTI',
				checkOnly: true,
				listeners: {
					selectionchange:{
						fn:me.onSelectionChange,
						scope:me
					}
				}
			}),
			tbarDisabled : [{
				xtype:'label',
				text: 'Search :'
			},{
				xtype:'textfield',
				flex:1,
				enableKeyEvents: true,
				listeners: {
					scope: this,
					keyup: this.onInputKeyUp,
					el: {
						click: function(e) {
							e.stopPropagation();
						}
					}
				}
			},{
				xtype:'button',
				iconCls : 'icon-cancel' ,
				handler : function(button,event) {
					me.menu.query('gridpanel')[0].getSelectionModel().deselectAll() ;
					me.menu.query('gridpanel')[0].getDockedItems('toolbar')[0].query('textfield')[0].reset() ;
					me.onTypeAhead() ;
				},
				scope : me
			}]
		});
		
		me.menu.on('beforeshow',function(){
			me.onMenuBeforeShow() ;
		},me) ;
		me.menu.on('hide',function(){
			me.onMenuHide() ;
		},me) ;
		me.menu.on('destroy',function() {
			
		},me);
	},
	activateMenu: Ext.emptyFn,
	
	onInputKeyUp : function (field, e) {
		// restart the timer
		this.updateTask.delay(this.updateBuffer);
	},
	onTypeAhead: function() {
		return ;
		var me = this ;
		
		var textfield = me.menu.query('gridpanel')[0].getDockedItems('toolbar')[0].query('textfield')[0] ;
		var mvalue = textfield.getRawValue() ;
		if( mvalue.length == 0 ) {
			me.myStore.load() ;
			return ;
		}
		if( mvalue.length < 3 ) {
			me.myStore.removeAll() ;
			return ;
		}
		
		me.myStore.load({
			filters : [new Ext.util.Filter({
				property: 'str_search',
				value   : mvalue
			})]
		}); ;
	},
	
	onSelectionChange: function(selmodel, selrecords){
		var me = this ;
		
		if( me.silentSelection ) {
			return ;
		}
		
		var mTab = new Array() ;
		Ext.Object.each( selrecords, function(k,o){
			mTab.push(o.get('string')) ;
		}) ;
		me.inputValue = mTab ;
		
		me.filter.setValue(mTab);
		
		var hasRecords = (mTab.length > 0) ;
		if( hasRecords && me.active ) {
			me.updateStoreFilter();
		} else {
			me.setActive( mTab.length > 0 ) ;
		}
	},
	
	getValue : function(field) {
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
		return ;
		var me = this ;
		
		if( me.menu.rendered && this.getValue().length > 0 ) {
			me.silentSelection = true ;
			me.menu.query('gridpanel')[0].getSelectionModel().deselectAll(true) ;
			me.silentSelection = false ;
			
			var parameters = new Object() ;
			Ext.apply(parameters,{
				filters: [ new Ext.util.Filter({
					property: 'entry_key',
					value   : this.getValue()
				})]
			});
			me.myStore.on('load',function(mstore,mrecords){
				me.silentSelection = true ;
				me.menu.query('gridpanel')[0].getSelectionModel().selectAll(true) ;
				me.silentSelection = false ;
			},me,{
				single:true
			});
			me.myStore.load(parameters) ;
		}
		else {
			me.myStore.load() ;
		}
	},
	onMenuHide: function() {
		return ;
		var me = this ;
		
		if( me.menu.rendered ) {
			me.silentSelection = true ;
			me.menu.query('gridpanel')[0].getSelectionModel().deselectAll(true) ;
			me.silentSelection = false ;
			
			me.myStore.removeAll() ;
			
			me.menu.query('gridpanel')[0].getDockedItems('toolbar')[0].query('textfield')[0].setRawValue('') ;
		}
		else {
			// rien
		}
	}
});
