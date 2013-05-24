Ext.define('Optima5.Modules.CrmBase.QueryResultPanel' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryTemplateManager',
		'Ext.ux.dams.IFrameContent'
	],
			  
	ajaxBaseParams:{},
	RES_id: '',
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryPanel','No module reference ?') ;
		}
		
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
		
		Optima5.Modules.CrmBase.QueryTemplateManager.loadStyle(me.optimaModule);
		
		var ajaxParams = {} ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction:'res_get',
			RES_id:me.RES_id
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					me.destroy() ;
				}
				else {
					var ajaxData = Ext.decode(response.responseText) ;
					me.initAddToolbar( ajaxData ) ;
					if( ajaxData.tabs ) {
						me.initAddTabs( ajaxData ) ;
					} else if( ajaxData.html ) {
						me.initAddHtml( ajaxData ) ;
					}
				}
			},
			scope: me
		});
	},
	initAddToolbar:function( ajaxData ){
		var dockedTopToolbar = this.query('toolbar')[0] ;
	},
	initAddHtml: function( ajaxData ) {
		var me = this ;
		me.add(Ext.create('Ext.ux.dams.IFrameContent',{
			content:ajaxData.html
		})) ;
	},
	initAddTabs:function( ajaxData ){
		var me = this ;
		
		var tabitems = new Array() ;
		var columns = null ;
		var fields = null ;
		var tabCount = -1 ;
		Ext.Array.each( ajaxData.tabs , function(tabData) {
			tabCount++ ;
			
			if( tabData.html ) {
				tabitems.push( Ext.create('Ext.ux.dams.IFrameContent',{
					title:tabData.tab_title,
					content:tabData.html
				}) ) ;
				return true ;
			}
			
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
						renderer: function(value,metaData,record) {
							if( record.get('detachedRow') ) {
								return '<i>'+value+'</i>' ;
							} else {
								return '<b>'+value+'</b>' ;
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
				Ext.apply(columnDef,{
					align:'',
				});
				if( !columnDef.invisible ) {
					columns.push(columnDef);
				}
				
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
				cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
				title:tabData.tab_title,
				columns:columns,
				store:tabstore,
				verticalScroller: {
						xtype: 'paginggridscroller',
						activePrefetch: false
				},
				invalidateScrollerOnRefresh: false,
				viewConfig: { 
					//stripeRows: false, 
					getRowClass: function(record) { 
						return record.get('detachedRow') ? 'op5crmbase-detachedrow' : ''; 
					}
				} 											 
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
			if( records.length > 0 ) {
				tabstore.cacheRecords(records);
				tabstore.guaranteeRange(0, 49);
			}
			
			tabitems.push(tabgrid);
			return true ;
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
		
		var ajaxParams = me.optimaModule.getConfiguredAjaxParams() ;
		Ext.apply(ajaxParams,me.ajaxBaseParams) ;
		Ext.apply(ajaxParams,{
			_subaction:'exportXLS',
			RES_id:me.RES_id
		});
		
		
		Ext.create('Ext.ux.dams.FileDownloader',{
			renderTo: Ext.getBody(),
			requestParams: ajaxParams,
			requestAction: Optima5.Helper.getApplication().desktopGetBackendUrl(),
			requestMethod: 'POST'
		}) ;		
	}
}) ;