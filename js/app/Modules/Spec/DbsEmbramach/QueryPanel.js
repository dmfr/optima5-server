Ext.define('Optima5.Modules.Spec.DbsEmbramach.QueryPanel',{
	extend:'Ext.panel.Panel',
	requires: [],
	
	viewMode: 'day',
	
	
	
	initComponent: function() {
		Ext.apply(this,{
			layout: 'fit',
			border: false,
			items: [{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}],
			tbar:[{
				hidden: this.noDestroy,
				icon: 'images/op5img/ico_back_16.gif',
				text: '<u>Retour menu</u>',
				handler: function(){
					this.doQuit() ;
				},
				scope: this
			},{
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				text: 'Refresh',
				handler: function() {
					this.doRefresh() ;
				},
				scope: this
			},{
				iconCls: 'op5-spec-dbsembramach-report-clock',
				itemId: 'tbViewmode',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:function(menuitem) {
							//console.log('ch view '+menuitem.itemId) ;
							this.onViewSet( menuitem.itemId ) ;
						},
						scope:this
					},
					items: [{
						itemId: 'day',
						text: 'by Day',
						iconCls: 'op5-spec-dbsembramach-report-view-day'
					},{
						itemId: 'week',
						text: 'by Week',
						iconCls: 'op5-spec-dbsembramach-report-view-week'
					},{
						itemId: 'month',
						text: 'by Month',
						iconCls: 'op5-spec-dbsembramach-report-view-month'
					}]
				}
			},'->',{
				itemId: 'xlsExport',
				text: 'Export XLS',
				icon: 'images/op5img/ico_save_16.gif',
				handler: function() {
					this.handleDownload() ;
				},
				scope: this
			}]
		});
		
		this.callParent() ;
		this.updateToolbar() ;
		
		this.startRequestChain() ;
	},
	
	doRefresh: function( jsonResponse ) {
		this.startRequestChain() ;
	},
	
	
	onViewSet: function( viewId ) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode'),
			tbViewmodeItem = tbViewmode.menu.getComponent(viewId),
			iconCls, text ;
		if( tbViewmodeItem ) {
			var oldViewMode = this.viewMode ;
			this.viewMode = viewId ;
		}
		
		this.updateToolbar() ;
		this.startRequestChain() ;
	},
	updateToolbar: function(doActivate) {
		var tbViewmode = this.child('toolbar').getComponent('tbViewmode') ;
		
		// View mode
		var tbViewmodeItem = tbViewmode.menu.getComponent(this.viewMode) ;
		if( tbViewmodeItem ) {
			tbViewmode.setText( 'View :'+'&#160;'+'<b>' + tbViewmodeItem.text + '</b>' );
			tbViewmode.setIconCls( tbViewmodeItem.iconCls );
		}
	},
	
	getAjaxAction: function() {
		var me = this ;
		switch( me.qType ) {
			case 'query' :
				return 'queries_builderTransaction' ;
			case 'qmerge':
				return 'queries_mergerTransaction' ;
			case 'qweb' :
				return 'queries_qwebTransaction' ;
			case 'qbook' :
			case 'qbook_ztemplate' :
				return 'queries_qbookTransaction' ;
			default :
				Optima5.Helper.logError('CrmBase:QdirectWindow','Invalid config') ;
				break ;
		}
	},
	startRequestChain: function() {
		this.showLoadmask() ;
		this.requestChainInit() ;
	},
	requestChainInit: function() {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_subaction: 'init',
			query_id: me.queryId,
			qmerge_id: me.qmergeId,
			qbook_id: me.qbookId,
			qweb_id: me.qwebId,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
					this.hideLoadmask() ;
					return ;
				}
				
				var titleProperty = me.qType + '_name' ;
				if( ajaxData[titleProperty] != null ) {
					//me.setTitle(me.optimaModule.getWindowTitle( ajaxData[titleProperty] )) ;
				}
				
				me.transaction_id = ajaxData.transaction_id ;
				me.requestChainSubmitCfg(ajaxData) ;
			},
			scope: this
		});
	},
	requestChainSubmitCfg: function(ajaxResponse) {
		var me = this ;
		
		var data_whereFields = ajaxResponse.data_wherefields ;
		var data_groupFields = ajaxResponse.data_groupfields ;
		
		var whereDateGt = new Date() ;
		var whereDateLt = new Date() ;
		var groupDateType ;
		switch( this.viewMode ) {
			case 'day' :
				whereDateGt.setDate(whereDateGt.getDate()-14) ;
				groupDateType = 'DAY' ;
				break ;
			case 'week' :
				whereDateGt.setDate(whereDateGt.getDate()-(12*7)) ;
				while( whereDateGt.getDay() != 1 ) {
					whereDateGt.setDate(whereDateGt.getDate()-1) ;
				}
				groupDateType = 'WEEK' ;
				break ;
			case 'month' :
				whereDateGt.setFullYear(whereDateGt.getFullYear()-1) ;
				while( whereDateGt.getDate() != 1 ) {
					whereDateGt.setDate(whereDateGt.getDate()-1) ;
				}
				groupDateType = 'MONTH' ;
				break ;
			default :
				break ;
		}
		
		Ext.Array.each( data_whereFields, function(whereField) {
			if( whereField.field_type == 'date' ) {
				whereField.condition_date_gt = Ext.Date.format(whereDateGt,'Y-m-d') ;
				whereField.condition_date_lt = Ext.Date.format(whereDateLt,'Y-m-d') ;
			}
		}) ;
		Ext.Array.each( data_groupFields, function(groupField) {
			if( groupField.field_type == 'date' ) {
				groupField.group_date_type = groupDateType ;
			}
		}) ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id: me.transaction_id,
			_subaction: 'submit',
			
			_qsimple: true,
			data_wherefields: Ext.JSON.encode(data_whereFields),
			data_groupfields: Ext.JSON.encode(data_groupFields)
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					this.hideLoadmask() ;
					if( ajaxData.query_error ) {
						Ext.Msg.alert('Query status', ajaxData.query_error);
					} else {
						Ext.Msg.alert('Failed', 'Unknown error / Missing parameters');
					}
					return ;
				}
				
				me.requestChainRun() ;
			},
			scope: this
		});
	},
	requestChainRun: function() {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id: me.transaction_id,
			_subaction: 'run'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					this.hideLoadmask() ;
					if( ajaxData.query_error ) {
						Ext.Msg.alert('Query status', ajaxData.query_error);
					} else {
						Ext.Msg.alert('Failed', 'Unknown error / Missing parameters');
					}
					return ;
				}
				
				me.RES_id = ajaxData.RES_id ;
				me.requestChainGet() ;
			},
			scope: this
		});
	},
	requestChainGet: function() {
		var me = this ;
		this.hideLoadmask() ;
		
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id: me.transaction_id
		});
		
		var queryResultPanel = Ext.create('Optima5.Modules.CrmBase.QueryResultPanel',{
			itemId: 'pQueryResult',
			optimaModule:me.optimaModule,
			ajaxBaseParams: baseAjaxParams,
			RES_id: me.RES_id,
			qbook_ztemplate_ssid: me.qbookZtemplateSsid
		}) ;
		queryResultPanel.down('toolbar').hide() ;
		
		me.removeAll() ;
		me.add(queryResultPanel) ;
	},
	
	onDestroy: function() {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id: me.transaction_id,
			_subaction: 'end'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams
		});
	},
	
	doQuit: function() {
		this.destroy() ;
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
	},
	
	
	
	handleDownload: function() {
		var queryResultPanel = this.down('#pQueryResult') ;
		if( queryResultPanel instanceof Optima5.Modules.CrmBase.QueryResultPanel ) {
			queryResultPanel.exportExcel() ;
		}
	}
});