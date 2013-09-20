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
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}],
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
		me.removeAll() ;
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
			Ext.Array.each(tabData.columns, function(columnDef,colIdx) {
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
			
			var tmpModelName = 'QueryResultModel-' + me.ajaxBaseParams._transaction_id + '-' + me.RES_id + '-' + tabCount ;
			//console.log('Defining a model '+tmpModelName) ;
			Ext.define(tmpModelName, {
				extend: 'Ext.data.Model',
				fields: fields
			});
			
			if( tabData.cfg_doTreeview && tabData.data_root ) {
				Ext.apply( columns[0], {
					xtype: 'treecolumn'
				}) ;
				
				var tabtree = Ext.create('Ext.tree.Panel',{
					title:tabData.tab_title,
					store: {
						model: tmpModelName,
						nodeParam: '_id',
						folderSort: true,
						root: tabData.data_root,
						clearOnLoad: true
					},
					useArrows: false,
					rootVisible: true,
					multiSelect: false,
					singleExpand: false,
					// viewConfig:{toggleOnDblClick: false},
					columns: columns
				}) ;
				
				tabtree.on('destroy',function(){
					// console.log('Unregistering model '+tmpModelName) ;
					Ext.ModelManager.unregister( tmpModelName ) ;
				},me);
				
				tabitems.push(tabtree);
				return true ;
			}
			
			var tabstore = Ext.create('Ext.data.Store',{
				model:tmpModelName,
				pageSize: (tabData.data.length > 50 ? tabData.data.length : 50 ),
				//pageSize: tabData.data.length,
				buffered: true,
				remoteSort: true, // this just keeps sorting from being disabled
				data: tabData.data,
				proxy:{
					type:'memory'
				},
				
				/* 
				* Custom sort function that overrides the normal store sort function.
				* Basically this pulls all the buffered data into a MixedCollection
				* and applies the sort to that, then it puts the SORTED data back
				* into the buffered store.               
				*/                    
				sort: function(sorters) {
					var collection = new Ext.util.MixedCollection();
					collection.addAll(this.getProxy().data);
					collection.sort(sorters);
					
					this.pageMap.clear();
					this.getProxy().data = collection.getRange();
					this.load();
				}
			});
			
			var tabgrid = Ext.create('Ext.grid.Panel',{
				xtype:'grid',
				cls:'op5crmbase-querygrid-'+me.optimaModule.sdomainId,
				title:tabData.tab_title,
				columns:columns,
				store:tabstore,
				/* verticalScroller: {
					numFromEdge: 5,
					trailingBufferZone: 10,
					leadingBufferZone: 20
				},*/
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
			
			tabitems.push(tabgrid);
			return true ;
		},me) ;
		
		me.removeAll() ;
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