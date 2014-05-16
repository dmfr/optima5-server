Ext.define('WbBudgetAssortColumnModel', {
	extend: 'Ext.data.Model',
	idProperty: 'store_code',
	fields: [
		{name: 'store_code',  type: 'string'},
		{name: 'store_text',   type: 'string'}
	]
});
Ext.define('WbBudgetAssortRowModel', {
	extend: 'Ext.data.Model',
	idProperty: 'date_sql',
	fields: [
		{name: 'row_is_prod',  type: 'boolean'},
		{name: 'row_sku_idx', type:'int', useNull: true},
		{name: 'prod_code',   type: 'string'},
		{name: 'prod_text',   type: 'string'},
		{name: 'prod_is_sku',   type: 'boolean'}
	]
});


Ext.define('WbBudgetAssortProdModel', {
	extend: 'Ext.data.Model',
	idProperty: 'prod_code',
	fields: [
		{name: 'prod_code',   type: 'string'},
		{name: 'assort_is_on',   type: 'boolean'}
	]
});
Ext.define('WbBudgetAssortModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'crop_year',  type: 'string'},
		{name: 'store_code',   type: 'string'}
	],
	hasMany: [{
		model: 'WbBudgetAssortProdModel',
		name: 'prods',
		associationKey: 'prods'
	}]
});


Ext.define('Optima5.Modules.Spec.WbBudget.AssortBuildPanel',{
	extend: 'Ext.panel.Panel',
	
	_ps_storeNodes: null,
	_ps_recordsObj: null, // prod_code > store_code > boolean
	
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
			},'->',{
				itemId: 'tbSave',
				icon: 'images/op5img/ico_save_16.gif',
				text: 'Save Crop' ,
				handler: this.handleSave,
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
			tbCountrySelect = this.query('#tbCountrySelect')[0] ;
		
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
		if( this.filterCountry && this.filterCropYear ) {
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
			_action: 'assortbuild_getGrid',
			filter_country: this.filterCountry,
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
		
		
		// model name
		var tmpModelName = 'WbAssortRowModel-' + this.getId() ;
		// model
		var actualDataIndex = null ;
		var revisionIds = [] ;
		var fields = [
			{name: 'row_is_prod',  type: 'boolean'},
			{name: 'row_sku_idx', type:'int', useNull: true},
			{name: 'prod_code',   type: 'string'},
			{name: 'prod_text',   type: 'string'},
			{name: 'prod_is_sku',   type: 'boolean'}
		];
		Ext.Array.each( ajaxData.store_nodes, function(coldef,colidx) {
			fields.push( {name: 'value_'+colidx, type:'boolean', useNull:true} );
		}) ;
		Ext.define(tmpModelName, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		
		
		// build TreeStore
		me.treepanelStore = Ext.create('Ext.data.TreeStore',{
			model: tmpModelName,
			root: ajaxData.prod_tree_root,
			proxy: {
				type: 'memory' ,
				reader: {
					type: 'json'
				}
			}
		}) ;
		
		
		
		// build pseudo-stores
		me._ps_storeNodes = ajaxData.store_nodes ;
		
		me._ps_recordsObj = {} ;
		var colidx, coldef, colcount = me._ps_storeNodes.length ;
		me.treepanelStore.getRootNode().cascadeBy( function(node) {
			if( !node.data.prod_is_sku ) {
				return ;
			}
			var prod_code = node.data.prod_code ;
			me._ps_recordsObj[prod_code] = {} ;
			for( colidx=0 ; colidx<colcount ; colidx++ ) {
				coldef = me._ps_storeNodes[colidx] ;
				
				me._ps_recordsObj[prod_code][coldef.store_code] = false ;
			}
		}) ;
		
		Ext.Array.each( ajaxData.records, function(assortRecord) {
			var store_code = assortRecord.store_code ;
			Ext.Array.each( assortRecord.prods, function( assortProdRecord ) {
				var prod_code = assortProdRecord.prod_code ;
				if( typeof me._ps_recordsObj[prod_code][store_code] === 'undefined' ) {
					return ;
				}
				me._ps_recordsObj[prod_code][store_code] = ( assortProdRecord.assort_is_on == 1 ? true : false ) ;
			}) ;
		}) ;
		
		console.dir(me._ps_recordsObj) ;
		
		
		
		
		
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
		}] ;
		Ext.Array.each( ajaxData.store_nodes, function(coldef,colidx) {
			columns.push({
				xtype: 'checkcolumn',
				locked:false,
				text: coldef.store_text.split(' ').join('<br>') + '<br>',
				dataIndex: 'value_'+colidx,
				storeCode: coldef.store_code,
				width: 75,
				tdCls: 'op5-spec-wbbudget-build-treecell-value' ,
				align: 'center',
				listeners: {
					checkchange: function(checkCol, rowIdx, checked) {
						var treepanel = checkCol.up('treepanel'),
							view = treepanel.getView(),
							viewNode = view.getNode(rowIdx),
							record = view.getRecord(viewNode) ;
						var dataIndex = checkCol.dataIndex,
							storeCode = checkCol.storeCode,
							prodCode = record.get('prod_code') ;
						if( !record.get('prod_is_sku') ) {
							console.log(dataIndex) ;
							record.set(dataIndex,null) ;
							return ;
						}
						
						// DONE: save in pseudo store
						if( typeof this._ps_recordsObj[prodCode][storeCode] !== 'undefined' ) {
							this._ps_recordsObj[prodCode][storeCode] = record.get(dataIndex) ;
						}
					},
					scope: this
				}
			});
		},this) ;
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

		
		// Customize prod treeStore for display
		treepanelStoreRoot = me.treepanelStore.getRootNode() ;
		var row_sku_idx = 0 ;
		treepanelStoreRoot.cascadeBy(function(node) {
			if( node.data.row_is_spec_coef ) {
				return ;
			}
			node.data.row_is_prod = true ;
			if( node.data.prod_is_sku ) {
				row_sku_idx++ ;
				node.set('row_sku_idx',row_sku_idx) ;
				node.data.icon = 'images/op5img/ico_leaf_small.gif' ;
			} else {
				//console.dir(node) ;
				node.data.iconCls = 'treenode-no-icon' ;
			}
		}) ;
		
		var treepanel = {
			border: false,
			xtype:'treepanel',
			itemId: 'pTree',
			animate: false,
			useArrows: true,
			rootVisible: true,
			cls: 'op5-spec-wbbudget-build-tree',
			store: me.treepanelStore,
			plugins: [{
				ptype: 'bufferedrenderer',
				leadingBufferZone: 1,
				trailingBufferZone: 1
				//numFromEdge: 1
			}],
			columns: columns,
			viewConfig: {
				getRowClass: function(node) {
					if( !node.get('prod_is_sku') ) {
						return 'op5-spec-wbbudget-assort-cell-nocheckcolumn' ;
					}
					var row_sku_idx = node.get('row_sku_idx') || ( node.parentNode ? node.parentNode.get('row_sku_idx') : null ) ;
					if( row_sku_idx != null ) {
						var rowClass = '' ;
						rowClass += ' ' + ( row_sku_idx % 2 == 0 ? 'op5-spec-wbbudget-build-treerow-odd' : 'op5-spec-wbbudget-build-treerow-even' ) ;
						return rowClass ;
					}
				},
				listeners: {
					beforerefresh: function(treeview) {
						this.treeviewAdapter() ;
					},
					scope: this
				}
			}
		} ;
		
		this.removeAll() ;
		this.add( treepanel ) ;
		//this.doCalc() ;
		//this.updateToolbar() ;
	},
	treeviewAdapter: function() {
		var me = this ;
		
		var colidx, coldef, colcount = this._ps_storeNodes.length ;
		
		this.treepanelStore.getRootNode().cascadeBy( function(node) {
			if( !node.data.prod_is_sku ) {
				return ;
			}
			var prod_code = node.data.prod_code ;
			for( colidx=0 ; colidx<colcount ; colidx++ ) {
				coldef = this._ps_storeNodes[colidx] ;
				var dataIndex = 'value_'+colidx ;
				
				if( typeof this._ps_recordsObj[prod_code][coldef.store_code] === 'undefined' ) {
					//console.log( prod_code + ' ' + coldef.store_code ) ;
				}
				
				node.set(dataIndex, this._ps_recordsObj[prod_code][coldef.store_code]) ;
			}
			node.commit() ;
		},this);
		
	},
	
	
	
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	
	
	
	
	handleSave: function() {
		//rebuild records
		var assortRecords = [] ;
		
		var tmpObj = {} ;
		Ext.Object.each( this._ps_recordsObj, function( prodCode, obj1 ) {
			Ext.Object.each( obj1, function( storeCode, checked ) {
				if( typeof tmpObj[storeCode] === 'undefined' ) {
					tmpObj[storeCode] = {} ;
				}
				tmpObj[storeCode][prodCode] = checked ;
			}) ;
		}) ;
		
		var assortRecords = [] ;
		Ext.Object.each( tmpObj, function( storeCode, obj1 ) {
			var assortRecord = {
				crop_year: this.filterCropYear,
				store_code: storeCode,
				prods: []
			} ;
			Ext.Object.each( obj1, function( prodCode, checked ) {
				if( typeof tmpObj[storeCode] === 'undefined' ) {
					tmpObj[storeCode] = {} ;
				}
				assortRecord.prods.push({
					prod_code: prodCode,
					assort_is_on: checked
				}) ;
			}) ;
			assortRecords.push(assortRecord) ;
		},this) ;
		
		console.dir( assortRecords ) ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_wb_budget',
				_action: 'assortbuild_setRecords',
				records: Ext.JSON.encode(assortRecords)
			},
			success: function(response) {
				this.hideLoadmask() ;
				if( Ext.JSON.decode(response.responseText).success != true ) {
					Ext.MessageBox.alert('Erreur','Impossible de valider le statut.') ;
					return ;
				}
				this.treepanelStore.getRootNode().cascadeBy( function(node) {
					node.commit() ;
				}) ;
			},
			scope: this
		}) ;
	},
	
	handleQuit: function() {
		this.destroy() ;
	}
});