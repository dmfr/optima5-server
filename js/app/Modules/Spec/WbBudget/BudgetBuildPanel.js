Ext.define('WbBudgetCfgCropModel', {
    extend: 'Ext.data.Model',
    fields: [
        {name: 'crop_year', type: 'string'},
        {name: 'date_apply', type: 'string'},
		  {name: 'is_current', type: 'boolean'},
		  {name: 'is_preview', type: 'boolean'}
    ]
}) ;
Ext.define('WbBudgetCfgStoresModel', {
    extend: 'Ext.data.Model',
    idProperty: 'store_code',
    fields: [
        {name: 'store_code',  type: 'string', mapping: 'nodeKey' },
        {name: 'store_text',   type: 'string', mapping: 'nodeText'}
     ]
});



Ext.define('WbBudgetColumnModel', {
	extend: 'Ext.data.Model',
	idProperty: 'date_sql',
	fields: [
		{name: 'date_sql',  type: 'string'},
		{name: 'week_text',   type: 'string'},
		{name: 'date_sql_start',   type: 'string'},
		{name: 'date_sql_end',   type: 'string'}
	]
});
Ext.define('WbBudgetRowModel', {
	extend: 'Ext.data.Model',
	idProperty: 'date_sql',
	fields: [
		{name: 'row_is_prod',  type: 'boolean'},
		{name: 'row_sku_idx', type:'int', useNull: true},
		{name: 'prod_code',   type: 'string'},
		{name: 'prod_text',   type: 'string'},
		{name: 'prod_is_sku',   type: 'boolean'},
		{name: 'subrow_is_forecast',   type: 'boolean'},
		{name: 'subrow_is_real',   type: 'boolean'},
		{name: 'subrow_is_delta',   type: 'boolean'}
	]
});
Ext.define('WbBudgetRecordModel', {
	extend: 'Ext.data.Model',
	idProperty: 'date_sql',
	fields: [
		{name: 'date_sql',  type: 'string'},
		{name: 'store_code',   type: 'string'},
		{name: 'prod_code',   type: 'string'},
		{name: 'forecast_qty',   type: 'number'},
		{name: 'real_qty',   type: 'number'}
	]
});


Ext.define('Optima5.Modules.Spec.WbBudget.BudgetBuildPanel',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function(){
		Ext.apply(this,{
			//frame: true,
			border: false,
			layout: {
				type: 'card',
				align: 'stretch',
				deferredRender: true
			},
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<b>Back</b>',
				handler: function(){
					this.handleQuit() ;
				},
				scope: this
			},{
				xtype: 'tbseparator'
			},{
				itemId: 'tbCropYear',
				iconCls: 'op5-crmbase-datatoolbar-view-calendar',
				baseText: 'Crop selection',
				menu: {
					listeners: {
						click: function(menu, item) {
							if( item.cropYear != null && (menu.ownerButton) instanceof Ext.button.Button ) {
								menu.ownerButton.cropYear = item.cropYear ;
								this.onSelectCropYear() ;
							}
						},
						scope: this
					},
					items:[]
				},
				listeners: {
					render: function(button) {
						if( button.cropYear == null ) {
							button.setText( button.baseText ) ;
						}
					}
				}
			},{
				xtype: 'tbseparator'
			},{
				itemId: 'tbCountry',
				icon: 'images/op5img/ico_blocs_small.gif',
				text: 'Country Selection',
				menu: {
					xtype:'menu',
					items:[{
						xtype: 'treepanel',
						itemId: 'tbCountrySelect',
						width:250,
						height:300,
						store: {
							fields: [
								{name: 'country_code', type: 'string'},
								{name: 'country_text', type: 'string'},
								{name: 'country_iconurl', type: 'string'}
							],
							root: {children:[]},
							proxy: {
								type: 'memory' ,
								reader: {
									type: 'json'
								}
							}
						},
						displayField: 'country_text',
						rootVisible: true,
						useArrows: true
					}]
				}
			},{
				itemId: 'tbStores',
				icon: 'images/op5img/ico_blocs_small.gif',
				defaultText: 'Stores Selection',
				menu: {
					xtype:'menu',
					items:[{
						xtype: 'treepanel',
						itemId: 'tbStoresSelect',
						width:250,
						height:300,
						store: {
							fields: [
								{name: 'store_code', type: 'string'},
								{name: 'store_text', type: 'string'}
							],
							root: {children:[]},
							proxy: {
								type: 'memory' ,
								reader: {
									type: 'json'
								}
							}
						},
						displayField: 'store_text',
						rootVisible: true,
						useArrows: true
					}]
				}
			},'->',{
				itemId: 'tbReadonly',
				icon: 'images/op5img/ico_lock_small.gif',
				text: 'ReadOnly'
			},{
				itemId: 'tbEdit',
				icon: 'images/op5img/ico_new_16.gif',
				text: 'Current edit' ,
				cls: 'op5-spec-wbbudget-financebudget-newrevisionmenu',
				menu: [{
					iconCls: 'op5-spec-wbbudget-financebudget-newrevisionmenu-save',
					text: 'Commit revision' ,
					handler: function() {
						var doSave ;
						this.handleNewRevisionEnd( doSave = true ) ;
					},
					scope: this
				},{
					itemId: 'btnDiscard',
					iconCls: 'op5-spec-wbbudget-financebudget-newrevisionmenu-discard',
					text: 'Discard' ,
					handler: function() {
						var doSave ;
						this.handleNewRevisionEnd( doSave = false ) ;
					},
					scope: this
				}]
			},{
				itemId: 'tbExport',
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Export XLS' ,
				handler: this.handleDownload,
				scope: this
			}],
			items:[{
				xtype:'box',
				cls:'ux-noframe-bg',
				itemId:'init'
			}],
			listeners: {
				tbarselect: this.onTbarSelect,
				scope: this
			}
		});
		
		this.callParent() ;
		this.loadComponents() ;
	},
	loadComponents: function() {
		var me = this,
			tbCountrySelect = this.query('#tbCountrySelect')[0],
			tbStoresSelect = this.query('#tbStoresSelect')[0] ;
		
		countryChildren = [] ;
		Ext.Array.each( Optima5.Modules.Spec.WbBudget.HelperCache.countryGetAll(), function(rec) {
			countryChildren.push({
				leaf:true,
				checked: false,
				country_code: rec.get('country_code'),
				country_text: rec.get('country_display'),
				country_iconurl: rec.get('country_iconurl'),
				icon: rec.get('country_iconurl')
			});
		}, me) ;
		tbCountrySelect.setRootNode({
			root: true,
			children: countryChildren,
			expanded: true,
			country_code:'',
			country_text:'<b>'+'All countries'+'</b>',
			country_iconurl:'images/op5img/ico_planet_small.gif',
			checked:true,
			icon: 'images/op5img/ico_planet_small.gif'
		});
		tbCountrySelect.getView().on('checkchange',function(rec,check){
			var rootNode = rec ;
			while( !rootNode.isRoot() ) {
				rootNode = rootNode.parentNode ;
			}
			if( !check ) {
				rootNode.cascadeBy(function(chrec){
					if( chrec==rec ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				rootNode.cascadeBy(function(chrec){
					if( chrec != rec ) {
						chrec.set('checked',false) ;
					}
				},this);
				this.onSelectCountry() ;
			}
		},this) ;
		this.onSelectCountry(true) ;
		
		
		
		// Load crop years => server
		this.storeCfgCrop = Ext.create('Ext.data.Store',{
			model: 'WbBudgetCfgCropModel',
			autoLoad: true,
			proxy: this.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_moduleId: 'spec_wb_mrfoxy',
					_action: 'finance_getCfgCrop'
				},
				reader: {
					type: 'json',
					root: 'data'
				}
			}),
			listeners: {
				load: this.loadComponentsOnStoreCropLoad,
				scope: this
			}
		}) ;
		
		
		// Load stores => server
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'data_getBibleTreeOne',
			bible_code: 'IRI_STORE'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					this.storeCfgStores = Ext.create('Ext.data.TreeStore', {
						model: 'WbBudgetCfgStoresModel',
						root: ajaxData.dataRoot 
					});
				}
			},
			scope: me
		});
		tbStoresSelect.getView().on('checkchange',function(rec,check){
			var rootNode = rec ;
			while( !rootNode.isRoot() ) {
				rootNode = rootNode.parentNode ;
			}
			if( !check ) {
				rootNode.cascadeBy(function(chrec){
					if( chrec==rec ) {
						chrec.set('checked',true) ;
					}
				},this);
			} else {
				rootNode.cascadeBy(function(chrec){
					if( chrec != rec ) {
						chrec.set('checked',false) ;
					}
				},this);
				this.onSelectStores() ;
			}
		},this) ;
	},
	loadComponentsOnStoreCropLoad: function( storeCfgCrop ) {
		var menuitems = [],
			currentCropYear ;
		Ext.Array.each( storeCfgCrop.getRange(), function(cropRecord) {
			var cropData = cropRecord.data ;
			var key = cropData.crop_year ;
			var text = cropData.crop_year ;
			if( cropData.is_preview ) {
				text+= ' ' + '(<i>preview</i>)' ;
			} else if( cropData.is_current ) {
				text+= ' ' + '(<b>current</b>)' ;
				currentCropYear = cropData.crop_year ;
			}
			menuitems.push({
				text: text,
				cropYear: key
			}) ;
		}) ;
		this.down('#tbCropYear').menu.removeAll() ;
		this.down('#tbCropYear').menu.add( menuitems ) ;
		
		if( currentCropYear != null ) {
			this.down('#tbCropYear').cropYear = currentCropYear ;
			this.onSelectCropYear() ;
		}
	},
	loadComponentsOnStoreStoresLoad: function( treeStore ) {
		//console.log('done') ;
		console.dir( treeStore.getNodeById('FR') ) ;
	},
	
	onSelectCountry: function(silent) {
		var me = this,
			tbCountry = this.query('#tbCountry')[0],
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
		tbCountrySelect.getRootNode().cascadeBy(function(chrec){
			if( chrec.get('checked') ) {
				tbCountry.setIcon( chrec.get('country_iconurl') ) ;
				tbCountry.setText( chrec.get('country_text') ) ;
				
				me.filterCountry = chrec.get('country_code') ;
				return false ;
			}
		},this);
		
		
		
		
		var tbStores = this.query('#tbStores')[0],
			tbStoresSelect = this.query('#tbStoresSelect')[0] ;
		this.filterStores = null ;
		tbStores.setText( tbStores.defaultText ) ;
		if( this.filterCountry ) {
			tbStores.setVisible(true) ;
			var storeCfgStores = this.storeCfgStores,
				storesRootForCountry = storeCfgStores.getNodeById(this.filterCountry),
				tbStoresSelectStore = tbStoresSelect.getStore() ;
			if( storesRootForCountry == null ) {
				tbStoresSelectStore.setRootNode( null ) ;
			} else {
				tbStoresSelectStore.setRootNode( storesRootForCountry.copy(undefined,true) ) ;
			}
		} else {
			tbStores.setVisible(false) ;
		}
		
		if( !silent ) {
			me.fireEvent('tbarselect') ;
		}
	},
	onSelectStores: function(silent) {
		var me = this,
			tbStores = this.query('#tbStores')[0],
			tbStoresSelect = this.query('#tbStoresSelect')[0] ;
		
		tbStores.setText( tbStores.defaultText ) ;
		tbStoresSelect.getRootNode().cascadeBy(function(chrec){
			if( chrec.get('checked') ) {
				//tbStores.setIcon( chrec.get('country_iconurl') ) ;
				tbStores.setText( chrec.get('store_text') ) ;
				
				me.filterStores = chrec.get('store_code') ;
				
				return false ;
			}
		},this);
		
		if( !silent ) {
			me.fireEvent('tbarselect') ;
		}
	},
	onSelectCropYear: function(silent) {
		var me = this ;
			tbCropYear = this.query('#tbCropYear')[0] ;
			
		me.filterCropYear = tbCropYear.cropYear ;
		tbCropYear.setText( tbCropYear.baseText + (tbCropYear.cropYear ? ' '+'(<b>'+tbCropYear.cropYear+'</b>)' : '') ) ;
		
		if( !silent ) {
			me.fireEvent('tbarselect') ;
		}
	},
	
	onTbarSelect: function() {
		this.disablePanel() ;
		if( this.filterCountry && this.filterCropYear && this.filterStores ) {
			this.startLoading() ;
		}
	},
	disablePanel: function() {
		this.removeAll() ;
		this.add({
			xtype:'box',
			cls:'ux-noframe-bg',
			itemId:'init'
		}) ;
	},
	startLoading: function() {
		var ajaxParams = {
			_moduleId: 'spec_wb_budget',
			_action: 'budgetbuild_getGrid',
			filter_country: this.filterCountry,
			filter_stores: this.filterStores,
			filter_cropYear: this.filterCropYear
		};
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					return ;
				}
				this.onLoad(ajaxResponse) ;
			},
			scope: this
		}) ;
	},
	onLoad: function( ajaxData ) {
		var me = this ;
		me.ajaxData = ajaxData ;
		if( ajaxData == null ) {
			this.disablePanel() ;
			this.updateToolbarSetEditable(ajaxData.is_editable) ;
			return ;
		}
		
		var tmpModelName = 'WbBudgetRowModel-' + this.getId() ;
		
		// model
		var actualDataIndex = null ;
		var revisionIds = [] ;
		var fields = [
			{name: 'row_is_prod',  type: 'boolean'},
			{name: 'row_sku_idx', type:'int', useNull: true},
			{name: 'prod_code',   type: 'string'},
			{name: 'prod_text',   type: 'string'},
			{name: 'prod_is_sku',   type: 'boolean'},
			{name: 'subrow_is_forecast',   type: 'boolean'},
			{name: 'subrow_is_real',   type: 'boolean'},
			{name: 'subrow_is_delta',   type: 'boolean'}
		];
		fields.push( {name: 'value_'+'TOTAL', type:'number'} );
		Ext.Array.each( ajaxData.columns, function(coldef,colidx) {
			fields.push( {name: 'value_'+colidx, type:'number'} );
		}) ;
		Ext.define(tmpModelName, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		
		var columns = [{
			xtype: 'treecolumn',
			locked: true,
			text: 'Item',
			dataIndex: 'prod_code',
			width: 200,
			resizable: true,
			renderer: function( value, metaData, node ) {
				if( node.get('row_is_prod') && node.get('prod_code') == '&' ) {
					metaData.tdCls += ' ' + 'op5-spec-wbbudget-build-treecell-bold' ;
					value = 'Total Products' ;
				}
				if( node.get('row_is_prod') && !node.get('prod_is_sku') ) {
					metaData.tdCls += ' ' + 'op5-spec-wbbudget-build-treecell-bold' ;
				}
				return value ;
			}
		},{
			locked:true,
			text: 'Desc',
			dataIndex: 'prod_text',
			width: 200,
			resizable: true,
			renderer: function( value, metaData, node ) {
				if( node.get('subrow_is_real') ) {
					metaData.tdCls += ' ' + 'op5-spec-wbbudget-build-treecell-rightalign' ;
					value = 'Actual Sales' ;
				}
				if( node.get('subrow_is_delta') ) {
					metaData.tdCls += ' ' + 'op5-spec-wbbudget-build-treecell-rightalign' ;
					value = 'Actual / Forecast' ;
				}
				
				return value ;
			}
		},{
			locked:true,
			text: '<b>Total</b>',
			dataIndex: 'value_TOTAL',
			width: 75,
			//resizable: true,
			tdCls: 'op5-spec-wbbudget-build-treecell-value' ,
			align: 'right',
			editor:{
				xtype:'numberfield',
				hideTrigger:true,
				cls: 'op5-spec-wbbudget-build-editor-rightalign'
			}
		}] ;
		Ext.Array.each( ajaxData.columns, function(coldef,colidx) {
			columns.push({
				locked:false,
				text: 'S <b>'+coldef.week_text+'</b><br>'+coldef.date_sql_start+'<br>'+coldef.date_sql_end,
				dataIndex: 'value_'+colidx,
				dateSql: coldef.date_sql,
				width: 75,
				tdCls: 'op5-spec-wbbudget-build-treecell-value' ,
				align: 'right',
				editor:{
					xtype:'numberfield',
					hideTrigger:true,
					cls: 'op5-spec-wbbudget-build-editor-rightalign'
				}
			});
		}) ;
		var columnDefaults = {
			menuDisabled: true,
			draggable: false,
			sortable: false,
			hideable: false,
			resizable: false,
			groupable: false,
			lockable: false
		} ;
		Ext.Array.each( columns, function(column) {
			Ext.applyIf( column, columnDefaults ) ;
		}) ;

		
		var treepanelStore = Ext.create('Ext.data.TreeStore',{
			model: tmpModelName,
			root: ajaxData.prod_tree_root,
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				}
			}
		}) ;
		treepanelStoreRoot = treepanelStore.getRootNode() ;
		var row_sku_idx = 0 ;
		treepanelStoreRoot.cascadeBy(function(node) {
			if( node.data.row_is_spec_coef ) {
				return ;
			}
			node.data.row_is_prod = true ;
			if( node.data.prod_is_sku ) {
				
				// TODO: set forecast values
				
				// TODO: set real values
				
				
				row_sku_idx++ ;
				node.set('row_sku_idx',row_sku_idx) ;
				node.set('subrow_is_forecast',true) ;
				node.set('leaf',false) ;
				node.appendChild([{
					subrow_is_real: true,
					leaf: true,
					iconCls: 'treenode-no-icon'
				},{
					subrow_is_delta: true,
					leaf: true,
					iconCls: 'treenode-no-icon'
				}]) ;
				node.data.icon = 'images/op5img/ico_leaf_small.gif' ;
			} else {
				//console.dir(node) ;
				node.data.iconCls = 'treenode-no-icon' ;
			}
		}) ;
		
		var treepanel = {
			border: false,
			xtype:'treepanel',
			animate: false,
			useArrows: true,
			rootVisible: true,
			cls: 'op5-spec-wbbudget-build-tree',
			store: treepanelStore,
			plugins: [{
				ptype: 'bufferedrenderer',
				leadingBufferZone: 1,
				trailingBufferZone: 1
				//numFromEdge: 1
			},{
				ptype: 'cellediting',
				clicksToEdit: 1,
				listeners: {
					beforeedit: this.onGridBeforeEdit,
					edit: this.onGridAfterEdit,
					scope: this
				}
			}],
			columns: columns,
			viewConfig: {
				getRowClass: function(node) {
					if( node.get('row_is_spec_coef') ) {
						return 'op5-spec-wbbudget-build-treerow-coefs' ;
					}
					
					var row_sku_idx = node.get('row_sku_idx') || ( node.parentNode ? node.parentNode.get('row_sku_idx') : null ) ;
					if( row_sku_idx != null ) {
						var rowClass = '' ;
						if( node.data.subrow_is_forecast ) {
							rowClass += ' ' + 'op5-spec-wbbudget-build-treerow-forecast' ;
						}
						rowClass += ' ' + ( row_sku_idx % 2 == 0 ? 'op5-spec-wbbudget-build-treerow-odd' : 'op5-spec-wbbudget-build-treerow-even' ) ;
						return rowClass ;
					}
				}
			}
		} ;
		
		this.removeAll() ;
		this.add( treepanel ) ;
		//this.doCalc() ;
		//this.updateToolbar() ;
	},
	onGridBeforeEdit: function(editor, editObject) {
		if( !editObject.record.get('subrow_is_forecast') ) {
			return false ;
		}
		
		//regular edit
		return true ;
	},
	onGridAfterEdit: function(editor, editObject) {
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});