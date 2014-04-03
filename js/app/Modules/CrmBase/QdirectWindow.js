Ext.define('Optima5.Modules.CrmBase.QdirectWindow' ,{
	extend: 'Ext.window.Window',
	requires: [
		'Optima5.Modules.CrmBase.QueryResultPanel'
	],
	
	optimaModule: null,
	
	
	qType:'', /* 'query','qmerge' */
	
	queryId:null,
	queryNewFileId:null,
	
	qmergeId:null,
	qmergeNew:false,
	
	qbookId:null,
	qbookZtemplateSsid:null,
	qbookNew:false,
	
	qwebId:null,
	
	qsrcFilerecordId: null,
	
	initComponent: function() {
		var me = this ;
		
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QdirectWindow','No module reference ?') ;
		}
		
		Ext.apply(me, {
			width:800,
			height:600,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			layout:'fit'
		}) ;
		me.callParent() ;
		
		me.loadMask = Ext.create('Ext.LoadMask',{
			target: me,
			msg:'Loading query items'
		}) ;
		me.on('afterrender', function() {
			me.loadMask.show() ;
			me.startRequestChain() ;
		},me,{single:true}) ;
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
					me.loadMask.hide() ;
					return ;
				}
				
				var titleProperty = me.qType + '_name' ;
				if( ajaxData[titleProperty] != null ) {
					me.setTitle(me.optimaModule.getWindowTitle( ajaxData[titleProperty] )) ;
				}
				
				var qdirectTransactionId = ajaxData.transaction_id ;
				me.requestChainRun( qdirectTransactionId ) ;
			},
			scope: this
		});
	},
	requestChainRun: function(qdirectTransactionId) {
		var me = this ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id: qdirectTransactionId ,
			_subaction: 'run',
		});
		if( me.qsrcFilerecordId != null ) {
			Ext.apply(ajaxParams,{
				qsrc_filerecord_id: me.qsrcFilerecordId
			}) ;
		}
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					me.loadMask.hide() ;
					if( ajaxData.query_error ) {
						Ext.Msg.alert('Query status', ajaxData.query_error);
					} else {
						Ext.Msg.alert('Failed', 'Unknown error / Missing parameters');
					}
					return ;
				}
				
				var qdirectResId = ajaxData.RES_id ;
				me.requestChainGet( qdirectTransactionId, qdirectResId ) ;
			},
			scope: this
		});
	},
	requestChainGet: function(qdirectTransactionId, qdirestResId) {
		var me = this ;
		me.loadMask.hide() ;
		
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id : qdirectTransactionId
		});
		
		var queryResultPanel = Ext.create('Optima5.Modules.CrmBase.QueryResultPanel',{
			optimaModule:me.optimaModule,
			ajaxBaseParams: baseAjaxParams,
			RES_id: qdirestResId,
			qbook_ztemplate_ssid: me.qbookZtemplateSsid
		}) ;
		me.removeAll() ;
		me.add(queryResultPanel) ;
	}
});