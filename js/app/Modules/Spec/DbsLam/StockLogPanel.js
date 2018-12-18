Ext.define('DbsLamStockLogModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'mvt_filerecord_id', type:'int'},
		{name: 'stk_filerecord_id', type:'int'},
		
		{name: 'commit_is_ok', type:'boolean'},
		{name: 'commit_date', type:'boolean', dateFormat: 'Y-m-d H:i:s'},
		
		{name: 'transfer_txt', type:'string'},
		
		{name: 'adr_whse', type:'string'},
		{name: 'adr_id', type:'string'},
		{name: 'container_ref', type:'string'},
		{name: 'container_ref_display', type:'string'},
		{name: 'stk_prod', type:'string'},
		{name: 'stk_batch', type:'string'},
		{name: 'stk_datelc', type:'string'},
		{name: 'stk_sn', type:'string'},
		{name: 'mvt_qty', type:'number'}
	]
});

Ext.define('Optima5.Modules.Spec.DbsLam.StockLogPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		this.tmpModelName = 'DbsLamStockLogGridModel-' + this.getId() ;
		this.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpModelName ) ;
		}) ;
		
		Ext.apply(this, {
			layout: 'fit',
				tbar:[{
					itemId: 'btnTitle',
					iconCls: 'op5-spec-dbslam-stock-logs',
					text: '-',
					handler: null,
					scope: this
				},'->',{
					//itemId: 'tbClose',
					icon: 'images/op5img/ico_reload_small.gif',
					text: 'Reload',
					handler: function() {
						this.doLoad() ;
					},
					scope: this
				},{
					icon: 'images/op5img/ico_save_16.gif',
					text: 'Export',
					handler: function() {
						//
					},
					scope: this
				}],
			items: []
		});
		this.callParent() ;
		//this.mon(this.optimaModule,'op5broadcast',this.onCrmeventBroadcast,this) ;
		this.on('beforedeactivate', function() {
			// HACK !!!
			if( !this.down('#pGrid') ) {
				return ;
			}
			if( this.down('#pGrid').getStore().loading || this.down('#pGrid').getView().isRefreshing ) {
				return false ;
			}
		},this) ;
		
		this.doConfigure() ;
		this.doLoad() ;
	},
	doConfigure: function() {
		// title ?
		var title, btnText ;
		switch( this._log_filter_property ) {
			case 'container_ref' :
				btnText = 'Container : <b>'+this._log_filter_value+'</b>' ;
				break ;
			case 'prod_id' :
				btnText = 'P/N : <b>'+this._log_filter_value+'</b>' ;
				break ;
			case 'adr_id' :
				btnText = 'Location : <b>'+this._log_filter_value+'</b>' ;
				break ;
		}
		title = 'StkLog - '+btnText ;
		this.down('toolbar').down('#btnTitle').setText(btnText) ;
		this.setTitle(title) ;
		
		var pushModelfields = [], atrStockColumns = [] ;
		Ext.Array.each( Optima5.Modules.Spec.DbsLam.HelperCache.getAttributeAll(), function( attribute ) {
			
			var fieldColumn = {
				locked: true,
				text: attribute.atr_txt,
				dataIndex: attribute.mkey,
				width: 75
			} ;
			if( attribute.STOCK_fieldcode ) {
				atrStockColumns.push(fieldColumn) ;
			}
			
			pushModelfields.push({
				name: attribute.mkey,
				type: 'string'
			});
		}) ;
		
		Ext.ux.dams.ModelManager.unregister( this.tmpModelName ) ;
		Ext.define(this.tmpModelName, {
			extend: 'DbsLamStockLogModel',
			fields: pushModelfields
		});
		
		
		var gridColumns = {
			defaults: {
				menuDisabled: true,
				draggable: false,
				sortable: false,
				hideable: false,
				resizable: true,
				groupable: false,
				lockable: false
			},
			items: [{
				xtype: 'treecolumn',
				dataIndex: 'commit_date',
				text: 'Date/Time',
				width: 150
			},{
				text: '<b>Transfer/Doc</b>',
				dataIndex: 'transfer_txt',
				width: 150
			},{
				dataIndex: 'adr_id',
				text: 'Location',
				width: 100
			},{
				text: 'Stock Attributes',
				columns: atrStockColumns
			},{
				text: '<b>SKU details</b>',
				columns: [{
					dataIndex: 'container_ref',
					text: 'Cont/Ref',
					width: 100
				},{
					dataIndex: 'stk_prod',
					text: 'P/N',
					width: 100,
				},{
					dataIndex: 'stk_batch',
					text: 'BatchCode',
					width: 100
				},{
					dataIndex: 'mvt_qty',
					text: 'Qty disp',
					align: 'right',
					width: 75,
				},{
					dataIndex: 'stk_sn',
					text: 'Serial',
					width: 100
				}]
			}]
		};
		
		var treePanel = {
			xtype: 'treepanel',
			store: {
				model: 'DbsLamTransferTreeModel',
				root:{root: true, children:[]},
				proxy: {
					type: 'memory',
					reader: {
						type: 'json'
					}
				}
			},
			useArrows: true,
			rootVisible: false,
			multiSelect: false,
			singleExpand: false,
			columns: gridColumns,
		};
		
		this.add(treePanel) ;
	},
	doLoad: function() {
		this.showLoadmask() ;
		var ajaxParams = {
			_moduleId: 'spec_dbs_lam',
			_action: 'stock_getLogs'
		} ;
		if( this._log_filter_property ) {
			Ext.apply(ajaxParams,{
				log_filter_property: this._log_filter_property,
				log_filter_value: this._log_filter_value
			}) ;
		}
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams,
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success != true ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.onLoad(ajaxResponse.data) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	onLoad: function(ajaxData) {
		console.dir(ajaxData) ;
		
	},
	
	
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
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
	}
});
