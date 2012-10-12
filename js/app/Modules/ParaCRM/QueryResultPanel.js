Ext.define('Optima5.Modules.ParaCRM.QueryResultPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: ['Optima5.Modules.ParaCRM.QueryTemplateManager'],
			  
	ajaxBaseParams:{},
	RES_id: '',
			  
	initComponent: function() {
		var me = this ;
		Ext.apply( me, {
			border:false,
			layout: 'fit',
			autoDestroy: true,
					  
			dockedItems: [{
				xtype: 'toolbar',
				dock: 'top',
				items: ['->',{
					xtype:'button',
					text: 'Export Excel',
					icon: 'images/op5img/ico_save_16.gif',
					handler: me.exportExcel,
					scope:me
				}]
			}]
		}) ;
		this.callParent() ;
		
		Optima5.Modules.ParaCRM.QueryTemplateManager.loadStyle();
		
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction:'res_get',
			RES_id:me.RES_id
		});
		Optima5.CoreDesktop.Ajax.request({
			url: 'server/backend.php',
			params: ajaxParams ,
			succCallback: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					me.destroy() ;
				}
				else {
					var ajaxData = Ext.decode(response.responseText) ;
					me.initAddToolbar( ajaxData ) ;
					me.initAddGrids( ajaxData ) ;
				}
			},
			scope: me
		});
	},
	initAddToolbar:function( ajaxData ){
		var dockedTopToolbar = this.query('toolbar')[0] ;
	},
	initAddGrids:function( ajaxData ){
		var me = this ;
		
		var tabitems = new Array() ;
		var columns = null ;
		var fields = null ;
		var tabCount = -1 ;
		Ext.Array.each( ajaxData.tabs , function(tabData) {
			tabCount++ ;
			
			columns = [] ;
			fields = [] ;
			Ext.Array.each(tabData.columns, function(columnDef) {
				if( columnDef.text_bold == true ) {
					columnDef.text = '<b>'+columnDef.text+'</b>' ;
				}
				if( columnDef.text_italic == true ) {
					columnDef.text = '<i>'+columnDef.text+'</i>' ;
				}
				if( columnDef.is_bold == true ) {
					Ext.apply(columnDef,{
						renderer: function(value) {
							return '<b>'+value+'</b>' ;
						}
					}) ;
				}
				else {
					Ext.apply(columnDef,{
						tdCls: 'op5paracrm-datacolumn'
					}) ;
				}
				Ext.apply(columnDef,{
					align:'',
				});
				columns.push(columnDef);
				
				fields.push({
					name:columnDef.dataIndex,
					type:columnDef.dataType
				});
			},me);
			
			
			var tmpModelName = 'QueryResultModel-' + me.ajaxBaseParams._transaction_id + '-' + me.RES_id + '-' + tabCount ;
			//console.log('Defining a model '+tmpModelName) ;
			Ext.define(tmpModelName, {
				extend: 'Ext.data.Model',
				fields: fields
			});
			var tabstore = Ext.create('Ext.data.Store',{
				model:tmpModelName,
				pageSize: 50,
				buffered: true,
				purgePageCount: 0
			});
			var tabgrid = Ext.create('Ext.grid.Panel',{
				xtype:'grid',
				cls:'op5paracrm-querygrid',
				title:tabData.tab_title,
				columns:columns,
				store:tabstore,
				verticalScroller: {
						xtype: 'paginggridscroller',
						activePrefetch: false
				},
				invalidateScrollerOnRefresh: false
			});
			tabgrid.on('destroy',function(){
				// console.log('Unregistering model '+tmpModelName) ;
				Ext.ModelManager.unregister( tmpModelName ) ;
			},me);
			var ln = tabData.data.length,
				records = [],
				i = 0;
			for (; i < ln; i++) {
				records.push(Ext.create(tmpModelName, tabData.data[i]));
			}
			tabstore.cacheRecords(records);
			tabstore.guaranteeRange(0, 49);
			
			tabitems.push(tabgrid);
			
		},me) ;
		
		me.add({
				xtype:'tabpanel' ,
				//frame: true,
				border:false,
				activeTab: 0,
				defaults :{
						// bodyPadding: 10
				},
				items: tabitems
			}) ;
	},
	exportExcel: function(){
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_sessionName: op5session.get('session_id'),
			_moduleName: 'paracrm' ,
			_subaction:'exportXLS',
			RES_id:me.RES_id
		});
		
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: ajaxParams,
			requestAction: 'server/backend.php',
			requestMethod: 'POST'
		}) ;		
	}
}) ;