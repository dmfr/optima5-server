Ext.define('Optima5.Modules.CrmBase.MainWindow',{
	extend:'Ext.window.Window',
	requires:[
		'Optima5.Modules.CrmBase.MainWindowButton',
		'Optima5.Modules.CrmBase.AuthAndroidPanel'
	],
	
	initComponent: function() {
		var me = this ;
		Ext.apply(me,{
			width:250,
			height:600,
			resizable:false,
			maximizable:false,
			layout:'fit',
			items:[{
				xtype:'toolbar',
				vertical:true,
				layout:{
					align:'stretch'
				},
				defaults:{
					xtype:'op5paracrmmwbutton',
					scale:'large',
					textAlign:'left',
					width:300,
					menuAlign:'tl-tr?',
					menu: {
						xtype:'menu',
						plain:true,
						items:[]
					}
				},
				items:[{
					itemId: 'btn-bible',
					textTitle: 'Bible Library',
					//textCaption: 'Bible',
					iconCls: 'op5-crmbase-waitcircle'
				},{
					itemId: 'btn-files',
					textTitle: 'Data Files',
					//textCaption: 'Bible',
					iconCls: 'op5-crmbase-waitcircle'
				},{
					itemId: 'btn-scen',
					textTitle: 'Scenarios',
					//textCaption: 'Bible',
					iconCls: 'op5-crmbase-mainwindow-scen',
					menu: null
				},{
					itemId: 'btn-query',
					textTitle: 'Queries / Qmerge',
					textCaption: 'Bible',
					iconCls: 'op5-crmbase-waitcircle'
				},{
					itemId: 'btn-admin',
					iconCls: 'op5-crmbase-mainwindow-admin',
					textTitle: 'Administration',
					textCaption: 'User accounts / Devices',
					menu: {
						xtype: 'menu',
						plain: true,
						items: [{
							text: 'ParaCRM accounts',
							icon: 'images/op5img/ico_kuser_small.gif',
							handler : function(){
								//console.dir(op5session) ;
								//console.log('Session ID is ' + op5session.get('sessionID')) ;
							}
						},{
							text: 'Android devices',
							icon: 'images/op5img/ico_android_16.png',
							handler : function(){
								this.openAuth('AuthAndroid') ;
							},
							scope:this
						}]
					}
				}]
			}]
		}) ;
		
		me.on('afterrender',function(){
			var totHeight = 0 ;
			Ext.Array.each(me.child('toolbar').query('>button'),function(item) {
				totHeight += item.getHeight() ;
			},me) ;
			me.setHeight(totHeight+50) ;
		},me);
		
		me.on('afterrender',function(){
			Ext.defer(me.syncData,500,me);
		},me,{single:true}) ;
		
		this.callParent() ;
		
		me.mon(me.optimaModule,'op5broadcast',me.onCrmeventBroadcast,me) ;
	},
	onCrmeventBroadcast: function( crmEvent, eventParams ) {
		var me = this ;
		switch( crmEvent ) {
			case 'togglepublish' :
			case 'definechange' :
				me.syncData() ;
				break ;
		}
	},
	
	
	
	syncData: function() {
		var me = this ;
		
		var ajaxConnection = me.optimaModule.getConfiguredAjaxConnection() ;
		ajaxConnection.request({
			params: {
				_action : 'define_getMainToolbar',
				data_type : 'bible'
			},
			success: me.onLoadBible,
			scope: me
		});
		ajaxConnection.request({
			params: {
				_action : 'define_getMainToolbar',
				data_type : 'file'
			},
			success: me.onLoadFiles,
			scope: me
		});
		ajaxConnection.request({
			params: {
				_action : 'queries_getToolbarData'
			},
			success: me.onLoadQuery,
			scope: me
		});
	},
	onLoadBible: function( response ) {
		var me = this ;
		
		var btnBible = me.child('toolbar').child('#btn-bible') ;
		
		var menuCfg = Ext.decode(response.responseText) ;
		Ext.Array.each( menuCfg, function(o) {
			Ext.apply(o,{
				handler: function() {
					me.openBible( o.bibleId ) ;
				},
				scope:me
			}) ;
		},me) ;
		
		if( btnBible.menu ) {
			btnBible.menu.removeAll() ;
			btnBible.menu.add(menuCfg) ;
		}
		btnBible.setIconCls('op5-crmbase-mainwindow-bible') ;
		btnBible.setObjText({
			title: btnBible.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(menuCfg)
		});
	},
	onLoadFiles: function( response ) {
		var me = this ;
		
		var btnFiles = me.child('toolbar').child('#btn-files') ;
		
		var menuCfg = Ext.decode(response.responseText) ;
		Ext.Array.each( menuCfg, function(o) {
			Ext.apply(o,{
				handler: function() {
					me.openFile( o.fileId ) ;
				},
				scope:me
			}) ;
		},me) ;
		
		if( btnFiles.menu ) {
			btnFiles.menu.removeAll() ;
			btnFiles.menu.add(menuCfg) ;
		}
		btnFiles.setIconCls('op5-crmbase-mainwindow-files') ;
		btnFiles.setObjText({
			title: btnFiles.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(menuCfg)
		});
	},
	onLoadQuery: function( response ) {
		var me = this ;
		
		var respObj = Ext.decode(response.responseText) ;
		
		/* ********* Liste des queries / qmerges *********
		- AssocArray(Obj) QueryId => QueryName
		- Array de toutes les queries déja incluses dans 1 qmerge
		- Constitution des menu items
		************************************************* */
		var qObjIdName = {} ,
			qObjIdIspub = {} ;
		Ext.Array.each( respObj.data_queries , function(v) {
			var queryId = parseInt(v.queryId) ;
			var queryName = v.text ;
			var isPublished = (v.isPublished==true)? true : false ;
			
			qObjIdName[queryId] = queryName ;
			qObjIdIspub[queryId] = isPublished ;
		},me) ;
		var qmergeQueryIds = [] ;
		Ext.Array.each( respObj.data_qmerges , function(v) {
			Ext.Array.each( v.qmerge_queries , function(v2) {
				var queryId = parseInt(v2) ;
				if( !Ext.Array.contains(qmergeQueryIds,queryId) ) {
					qmergeQueryIds.push(queryId) ;
				}
			},me) ;
		},me) ;
		
		var qMenuItems = [] ;
		Ext.Array.each( respObj.data_qmerges , function(v) {
			var qMenuSubItems = [] ;
			Ext.Array.each( v.qmerge_queries , function(v2) {
				var queryId = parseInt(v2) ;
				if( typeof qObjIdName[queryId] === 'undefined' ) {
					return ;
				}
				qMenuSubItems.push({
					queryId : queryId,
					isPublished: (qObjIdIspub[queryId] == true)? true:false,
					text: qObjIdName[queryId],
					icon: 'images/op5img/ico_process_16.gif' ,
					cls: (qObjIdIspub[queryId] == true)? me.clsForPublished:null,
					handler: function(){
						me.openQuery( queryId ) ;
					},
					scope: me,
				}) ;
			},me) ;
			
			qMenuItems.push({
				qmergeId: v.qmergeId,
				isPublished: v.isPublished,
				text: v.text,
				icon: 'images/op5img/ico_filechild_16.gif' ,
				cls: (v.isPublished == true)? me.clsForPublished:null,
				handler: function(){
					me.openQmerge( parseInt(v.qmergeId) ) ;
				},
				scope: me,
				menu:qMenuSubItems
			});
		},me) ;
		Ext.Array.each( respObj.data_queries , function(v) {
			var queryId = parseInt(v.queryId) ;
			if( Ext.Array.contains(qmergeQueryIds,queryId) ) {
				return ;
			}
			
			qMenuItems.push({
				queryId: queryId,
				isPublished: v.isPublished,
				text: v.text,
				icon: 'images/op5img/ico_process_16.gif' ,
				cls: (v.isPublished == true)? me.clsForPublished:null,
				handler: function(){
					me.openQuery( queryId ) ;
				},
				scope: me,
			});
		},me) ;
		Ext.Array.sort( qMenuItems, function(o1,o2) {
			if( o1.text < o2.text ) {
				return -1 ;
			} else if(  o1.text > o2.text ) {
				return 1 ;
			} else {
				return 0 ;
			}
		}) ;
		
		
		
		var btnQuery = me.child('toolbar').child('#btn-query') ;
		var menuCfg = Ext.decode(response.responseText) ;
		btnQuery.setIconCls('op5-crmbase-mainwindow-query') ;
		btnQuery.setObjText({
			title: btnQuery.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(qMenuItems)
		});
		
		var menuItems = [] ;
		// ajout du "new"
		if( respObj.data_filetargets && respObj.data_filetargets.length > 0 ) {
			var subMenuFiles = Ext.Array.clone( respObj.data_filetargets ) ;
			Ext.Array.each( subMenuFiles, function(o) {
				Ext.apply(o,{
					handler: function() {
						me.openQueryNew( o.fileId ) ;
					},
					scope: me
				}) ;
			}) ;
			menuItems.push({
				icon: 'images/op5img/ico_new_16.gif' ,
				text: 'Create Query on ' ,
				menu: subMenuFiles
			}) ;
		}
		// ajout du "new" Qmerge
		if( respObj.data_queries && respObj.data_queries.length > 0 ) {
			menuItems.push({
				icon: 'images/op5img/ico_casier_small.gif' ,
				text: 'Create Qmerge on queries' ,
				handler : function() {
					me.openQmergeNew() ;
				},
				scope : me
			}) ;
		}
		if( respObj.data_filetargets && respObj.data_filetargets.length > 0
				&& qMenuItems.length > 0 ) {
			
			menuItems.push('-') ;
		}
		menuItems = Ext.Array.union(menuItems,qMenuItems) ;
		if( true ) {
			menuItems.push('-') ;
			menuItems.push({
				icon: 'images/op5img/ico_config_small.gif' ,
				text: 'Cfg templates' ,
				handler: function() {
					me.openQueryTemplate() ;
				},
				scope:me
			}) ;
		}
		
		if( btnQuery.menu ) {
			btnQuery.menu.removeAll() ;
			btnQuery.menu.add(menuItems) ;
		}
	},
	getHeadlines: function( menuCfgArray ) {
		var sortedCfgArray = Ext.Array.sort( Ext.clone(menuCfgArray), function(o1,o2) {
			if( o1.isPublished != o2.isPublished ) {
				return o2.isPublished ? 1 : -1 ;
			}
			if( o1.count != o2.count ) {
				return ( o2.count - o1.count > 0 ) ? 1 : -1 ;
			} else {
				return 0 ;
			}
		}) ;
		
		var resultStr = '' ;
		Ext.Array.each( sortedCfgArray, function(v) {
			if( v.file_parent_code && v.file_parent_code != '' ) {
				return true ;
			}
			if( resultStr.length > 0 ) {
				resultStr += ', ' ;
			}
			resultStr += v.text ;
			if( resultStr.length > 50 ) {
				return false ;
			}
			return true ;
		}) ;
		return resultStr ;
	}
}) ;