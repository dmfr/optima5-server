Ext.define('Optima5.Modules.CrmBase.QsimplePanel' ,{
	extend: 'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.CrmBase.QuerySubpanelWhere',
		'Optima5.Modules.CrmBase.QmergeSubpanelMwhere',
		'Optima5.Modules.CrmBase.QwebSubpanelQwhere'
	],
	
	alias: 'widget.op5crmbaseqsimple',
	
	
	headerTpl: [
		'<div class="op5-crmbase-qsimpleheader-wrap">',
		'<span class="op5-crmmbase-qsimpleheader-title">{title}</span>',
		'<br>',
		'<span class="op5-crmmbase-qsimpleheader-caption">{caption}</span>',
		'<div class="op5-crmbase-qsimpleheader-icon"></div>',
		'</div>'
	],
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:QueryPanel','No module reference ?') ;
		}
		
		Ext.apply( me, {
			border:false,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items:[{
				xtype:'box',
				cls:'op5-waiting',
				flex:1
			}],
			autoDestroy: true
		}) ;
		
		me.callParent() ;
	},
	queryOpen: function( queryId ) {
		var me = this ;
		me.qType = 'query' ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_subaction: 'init',
			query_id: queryId,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.query_id = queryId ;
					me.query_name = Ext.decode(response.responseText).query_name ;
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText) ) ;
				}
			},
			scope: this
		});
	},
	qmergeOpen: function( qmergeId ) {
		var me = this ;
		me.qType = 'qmerge' ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_subaction: 'init',
			qmerge_id: qmergeId,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.qmerge_id = qmergeId ;
					me.qmerge_name = Ext.decode(response.responseText).qmerge_name ;
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText) ) ;
				}
			},
			scope: this
		});
	},
	qwebOpen: function( qwebId ) {
		var me = this ;
		me.qType = 'qweb' ;
		
		var ajaxParams = new Object() ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_subaction: 'init',
			qweb_id: qwebId,
			is_new: 'false'
		});
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.qweb_id = qwebId ;
					me.qweb_name = Ext.decode(response.responseText).qweb_name ;
					me.transaction_id = Ext.decode(response.responseText).transaction_id ;
					me.addComponents( Ext.decode(response.responseText) ) ;
				}
			},
			scope: this
		});
	},
	addComponents: function( ajaxParams ){
		var me = this ;
		
		me.removeAll();
		
		me.transaction_id = ajaxParams.transaction_id ;
		switch( me.qType ) {
			case 'qweb' :
				if( ajaxParams.qweb_id && ajaxParams.qweb_id > 0 ) {
					me.qweb_id = ajaxParams.qweb_id ;
					me.qweb_name =  ajaxParams.qweb_name ;
					
					me.add([{
						xtype:'component',
						height:80,
						tpl:me.headerTpl,
						data:{
							title: me.qweb_name,
							caption: 'Specify condition parameters below, then click "Run"'
						}
					},Ext.create('Optima5.Modules.CrmBase.QwebSubpanelQwhere', {
						optimaModule: me.optimaModule,
						qwhereFields: ajaxParams.qweb_qwherefields,
						flex:1 ,
						border:false
					})]);
				}
				break ;
			
			case 'query' :
				if( ajaxParams.query_id && ajaxParams.query_id > 0 ) {
					me.query_id = ajaxParams.query_id ;
					me.query_name =  ajaxParams.query_name ;
					
					// *** Création d'attributs/propriétés muettes
					//     pour simuler le fonctionnement d'un "vrai" QueryPanel
					me.treestore = Ext.create('Ext.data.TreeStore',{
						model: 'QueryFieldsTreeModel',
						nodeParam: 'field_code',
						root: ajaxParams.treefields_root
					});
					
					me.add([{
						xtype:'component',
						height:80,
						tpl:me.headerTpl,
						data:{
							title: me.query_name,
							caption: 'Specify condition parameters below, then click "Run"'
						}
					},{
						xtype:'tabpanel',
						flex:1,
						border:false,
						items:[Ext.create('Optima5.Modules.CrmBase.QuerySubpanelWhere', {
							title:'Where',
							optimaModule: me.optimaModule,
							whereFields: ajaxParams.data_wherefields
						}),Ext.create('Optima5.Modules.CrmBase.QuerySubpanelProgress',{
							title:'Progress',
							optimaModule: me.optimaModule,
							progressFields: ajaxParams.data_progressfields,
							hidden: (ajaxParams.data_progressfields.length == 0)? true:false
						})]
					}]);
				}
				break ;
			
			case 'qmerge' :
				if( ajaxParams.qmerge_id && ajaxParams.qmerge_id > 0 ) {
					me.qmerge_id = ajaxParams.qmerge_id ;
					me.qmerge_name =  ajaxParams.qmerge_name ;
					
					// *** Création d'attributs/propriétés muettes
					//     pour simuler le fonctionnement d'un "vrai" QmergePanel
					me.bibleQueriesStore = Ext.create('Ext.data.Store',{
						autoLoad: true,
						autoSync: true,
						model: 'QmergeQueryModel',
						data : ajaxParams.bible_queries,
						proxy: {
							type: 'memory' ,
							reader: {
									type: 'json'
							},
							writer: {
								type:'json',
								writeAllFields: true
							}
						}
					}) ;
					me.bibleFilesTreefields = {} ;
					Ext.Object.each( ajaxParams.bible_files_treefields, function(k,v) {
						var treestore = Ext.create('Ext.data.TreeStore',{
							model: 'QueryFieldsTreeModel',
							nodeParam: 'field_code',
							root: v
						});
						
						me.bibleFilesTreefields[k] = treestore ;
					},me) ;
					
					
					me.add([{
						xtype:'component',
						height:80,
						tpl:me.headerTpl,
						data:{
							title: me.qmerge_name,
							caption: 'Specify condition parameters below, then click "Run"'
						}
					},Ext.create('Optima5.Modules.CrmBase.QmergeSubpanelMwhere', {
						optimaModule: me.optimaModule,
						parentQmergePanel: me,
						mwhereStore: Ext.create('Ext.data.Store',{
							autoLoad: true,
							sortOnLoad: false,
							sortOnFilter: false,
							model: 'QmergeMwhereModel',
							data : ajaxParams.qmerge_mwherefields , //me.mwhereFields
							proxy: {
								type: 'memory'
							}
						}),
						flex:1 ,
						border:false
					})]);
				}
				break ;
		}
	},
	
	getAjaxAction: function() {
		var me = this ;
		switch( me.qType ) {
			case 'query' :
				return 'queries_builderTransaction' ;
			case 'qmerge' :
				return 'queries_mergerTransaction' ;
			case 'qweb' :
				return 'queries_qwebTransaction' ;
		}
	},
	getQueryPanelTreeStore: function() { // Fn bidon pour simuler le fonctionnement d'un "vrai" QueryPanel
		var me = this ;
		return me.treestore ;
	},
	remoteAction: function( actionCode, actionParam ) {
		var me = this ;
		switch( actionCode ) {
			case 'submit' :
				me.remoteActionSubmit( Ext.emptyFn, me ) ;
				break ;
				
			case 'toggle_publish' :
				var isPublished = actionParam ;
				me.remoteActionSubmit( me.remoteActionTogglePublish, me, [isPublished]  ) ;
				break ;
				
			case 'run' :
				me.remoteActionSubmit( me.remoteActionRun, me ) ;
				break ;
				
			default :
				break ;
		}
	},
	remoteActionSubmit: function( callback, callbackScope, callbackArguments ) {
		var me = this ;
		
		if( !callback ) {
			callback = Ext.emptyFn ;
		}
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id: me.transaction_id ,
			_subaction: 'submit',
			_qsimple: true
		}) ;
			
		switch( me.qType ) {
			case 'query' :
				Ext.apply(ajaxParams,{
					data_wherefields: Ext.JSON.encode(me.query('op5crmbasequerywhere')[0].saveGetArray() ) ,
					data_progressfields: Ext.JSON.encode(me.query('op5crmbasequeryprogress')[0].saveGetArray() )
				});
				break ;
				
			case 'qmerge' :
				var mwhereStore = me.query('op5crmbaseqmergemwhere')[0].mwhereStore ;
				var mwhereStoreData = [] ;
				var mwhereStoreRecords = mwhereStore.getRange();
				for (var i = 0; i < mwhereStoreRecords.length; i++) {
					saveObj = {} ;
					Ext.apply( saveObj, mwhereStoreRecords[i].data ) ;
					Ext.apply( saveObj, mwhereStoreRecords[i].getAssociatedData() ) ;
					mwhereStoreData.push(saveObj);
				}
				Ext.apply(ajaxParams,{
					qmerge_mwherefields: Ext.JSON.encode(mwhereStoreData)
				}) ;
				break ;
				
			case 'qweb' :
				Ext.apply(ajaxParams,{
					qweb_qwherefields: Ext.JSON.encode(me.query('op5crmbaseqwebqwhere')[0].saveGetArray() )
				});
				break ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					callback.call( me, callbackArguments ) ;
				}
			},
			scope: me
		});
	},
	remoteActionTogglePublish: function( isPublished ) {
		var me = this ;
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id: me.transaction_id ,
			_subaction: 'toggle_publish',
			isPublished: isPublished
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				else {
					me.optimaModule.postCrmEvent('togglepublishquery',{
						qType:me.qType,
						queryId:me.query_id,
						qmergeId:me.qmerge_id,
						qwebId:me.qweb_id
					}) ;
				}
			},
			scope: me
		});
	},
	remoteActionRun: function() {
		var me = this ;
		var msgbox = Ext.Msg.wait('Running query. Please Wait.');
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id: me.transaction_id ,
			_subaction: 'run'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				msgbox.close() ;
				var ajaxData = Ext.decode(response.responseText) ;
				if( ajaxData.success == false ) {
					if( ajaxData.query_error ) {
						Ext.Msg.alert('Query status', ajaxData.query_error);
					} else {
						Ext.Msg.alert('Failed', 'Unknown error / Missing parameters');
					}
				}
				else {
					// do something to open window
					me.openQueryResultPanel( ajaxData.RES_id ) ;
				}
			},
			scope: me
		});
	},
	openQueryResultPanel: function( resultId ) {
		var me = this ;
		
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_action: me.getAjaxAction(),
			_transaction_id : me.transaction_id
		});
		
		var queryResultPanel = Ext.create('Optima5.Modules.CrmBase.QueryResultPanel',{
			optimaModule:me.optimaModule,
			ajaxBaseParams: baseAjaxParams,
			RES_id: resultId
		}) ;
		
		var windowTitle = '' ;
		switch( me.qType ) {
			case 'query' :
				windowTitle = me.query_name ;
				break ;
			case 'qmerge' :
				windowTitle = me.qmerge_name ;
				break ;
			case 'qweb' :
				windowTitle = me.qweb_name ;
				break ;
		}
		var windowCfg = {
			title:windowTitle ,
			width:800,
			height:600,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			items: [ queryResultPanel ]
		} ;
		if( me.qType=='qweb' ) {
			Ext.apply(windowCfg,{
				width:925,
				height:700
			}) ;
		}
		
		me.optimaModule.createWindow(windowCfg) ;
		
		queryResultPanel.on('beforedestroy',function(destroyedpanel){
			if( destroyedpanel.up('window') ) {
				destroyedpanel.up('window').close() ;
			}
		});
	}
	

});