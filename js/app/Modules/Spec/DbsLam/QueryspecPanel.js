Ext.define('DbsLamQueryspecMismatchModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adr_id',
	fields: [
		{name: 'adr_id', type:'string', useNull:true},
		{name: 'inv_prod', type:'string'},
		{name: 'inv_batch', type:'string'},
		{name: 'inv_qty', type:'number', useNull:true}
	]
}) ;

Ext.define('DbsLamQueryspecDLCModel',{
	extend: 'Ext.data.Model',
	idProperty: 'adr_id',
	fields: [
		{name: 'adr_id', type:'string', useNull:true},
		{name: 'inv_prod', type:'string'},
		{name: 'inv_batch', type:'string'},
		{name: 'inv_qty', type:'number', useNull:true},
		{name: 'inv_datelc', type:'string'}
	]
}) ;

Ext.define('Optima5.Modules.Spec.DbsLam.QueryspecPanel',{
	extend:'Ext.panel.Panel',
	initComponent: function() {
		
		Ext.apply(this,{
			tbar:[{
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Back</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},{
				itemId: 'btnSave',
				icon: 'images/op5img/ico_save_16.gif',
				text: '<b>Save</b>',
				hidden: true,
				handler: function(){
					this.doDownload() ;
				},
				scope: this
			},{
			}],
			layout: 'fit',
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}]
		});
		this.callParent() ;
		this.doLoadTabs() ;
	},
	doLoadTabs: function() {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'queryspec'
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success != true ) {
					return ;
				}
				this.onLoadTabs( ajaxData.data ) ;
			},
			scope: this
		}) ;
	},
	onLoadTabs: function(ajaxData) {
		var tabs = [] ;
		Ext.Array.each(ajaxData, function(queryspec) {
			tabs.push({
				xtype: 'panel',
				_queryspecCode: queryspec.queryspec_code,
				title: queryspec.queryspec_title,
				layout: 'fit',
				items: []
			});
		}) ;
		
		this.removeAll() ;
		this.add({
			border: false,
			xtype: 'tabpanel',
			defaults: {
				listeners: {
					activate: this.onTabActivate,
					scope: this
				}
			},
			items:tabs
		});
	},
	updateToolbar: function() {
		var tabpanel = this.down('tabpanel'),
			activeTab = tabpanel.getActiveTab() ;
		this.down('toolbar').down('#btnSave').setVisible( activeTab && activeTab.down('grid') ) ;
	},
	
	onTabActivate: function(tab) {
		tab.removeAll() ;
		tab.add({
			xtype:'box',
			cls:'op5-waiting'
		}) ;
		
		this.updateToolbar() ;
		
		var queryspecCode = tab._queryspecCode ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			timeout: (300 * 1000),
			params: {
				_moduleId: 'spec_dbs_lam',
				_action: 'queryspec',
				queryspec_code: queryspecCode
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success != true ) {
					return ;
				}
				this.doInstallPreview( tab, ajaxData.data ) ;
				this.updateToolbar() ;
			},
			scope: this
		}) ;
	},
	
	doInstallPreview: function( tab, queryData ) {
		tab.tmpGridModelName = 'DbsLamQueryspecGridModel-' + tab.getId() ;
		tab.on('destroy',function(p) {
			Ext.ux.dams.ModelManager.unregister( p.tmpGridModelName ) ;
		}) ;
		
		tab.removeAll() ;
		tab.add( this.buildResultPanel(queryData,tab.tmpGridModelName) ) ;
	},
	buildResultPanel: function( tabData, tmpGridModelName ) {
		var me = this ;
		
		Optima5.Modules.CrmBase.QueryTemplateManager.loadStyle(me.optimaModule);
		
		var getRowClassFn = function(record,index) {
			var cssClasses = [] ;
			
			if( record.get('detachedRow') ) {
				cssClasses.push('op5crmbase-detachedrow') ;
			}
			
			return cssClasses.join(' ') ;
		} ;
		
		var daterenderer = Ext.util.Format.dateRenderer('Y-m-d');
		
		var columns = [] ;
		var fields = [{
			name:'_rowIdx', // server-side rowIdx ( ie related to row_pivotMap )
			type:'int'
		},{
			name:'_id',     // node "_id" (not used here but server available)
			type:'string'
		},{
			name:'_tdCls',     // node "_id" (not used here but server available)
			type:'string'
		}] ;
		Ext.Array.each(tabData.columns, function(columnDef,colIdx) {
			if( columnDef.text_bold == true ) {
				columnDef.text = ''+columnDef.text+'' ;
				columnDef.style = 'font-weight:bold' ;
			}
			if( columnDef.text_italic == true ) {
				columnDef.text = ''+columnDef.text+'' ;
			}
			if( columnDef.is_bold == true ) {
				Ext.apply(columnDef,{
					renderer: function(value,metaData,record) {
						if( record.get('detachedRow') ) {
							return ''+value+'' ;
						} else {
							return ''+value+'' ;
						}
					}
				}) ;
			}
			else if( columnDef.detachedColumn == true ) {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-detachedcolumn'
				}) ;
			}
			else if( columnDef.progressColumn == true ) {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-progresscolumn',
					renderer: function(value,meta) {
						if( value > 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-pos' ;
							return '+ '+Math.abs(value) ;
						} else if( value < 0 ) {
							meta.tdCls = 'op5crmbase-progresscell-neg' ;
							return '- '+Math.abs(value) ;
						} else if( value==='' ) {
							return '' ;
						} else {
							return '=' ;
						}
					}
				}) ;
			}
			else {
				Ext.apply(columnDef,{
					tdCls: 'op5crmbase-datacolumn'
				}) ;
			}
			if( columnDef.dataType == 'date' ) {
				Ext.apply(columnDef,{
					renderer: daterenderer
				}) ;
			}
			Ext.apply(columnDef,{
				align:''
			});
			if( !columnDef.invisible ) {
				columns.push(columnDef);
			}
			
			fields.push({
				name:columnDef.dataIndex,
				type:columnDef.dataType
			});
		},me);
		
		Ext.ux.dams.ModelManager.unregister( tmpGridModelName ) ;
		Ext.define(tmpGridModelName, {
			extend: 'Ext.data.Model',
			fields: fields
		});
		
		var tabgrid = Ext.create('Ext.grid.Panel',{
			flex: 1,
			border:false,
			//cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
			columns:columns,
			store:{
				model:tmpGridModelName,
				data: tabData.data,
				proxy:{
					type:'memory'
				}
			},
			plugins: [Ext.create('Ext.ux.ColumnAutoWidthPlugin', {
				allColumns: true,
				minAutoWidth: 90,
				singleOnly: true,
				suspendAutoSize: (columns.length > 20)
			})]
		});
		
		return tabgrid ;
	},
	
	doDownload: function() {
		var activeTab = this.down('tabpanel').getActiveTab() ;
		if( !activeTab ) {
			return ;
		}
		
		var queryspecCode = activeTab._queryspecCode ;
		
		var exportParams = this.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(exportParams,{
			_moduleId: 'spec_dbs_lam',
			_action: 'queryspec',
			queryspec_code: queryspecCode,
			exportXls: true
		}) ;
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: exportParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;
	},
	
	doQuit: function() {
		this.destroy() ;
	}
});