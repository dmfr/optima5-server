Ext.define('Optima5.Modules.CrmBase.MainDscWindow',{
	extend:'Ext.window.Window',
	requires:[
		'Optima5.Modules.CrmBase.MainWindowButton',
		
		'Optima5.Modules.CrmBase.DataWindow'
	],
	
	clsForPublished: 'op5-crmbase-published',
	
	initComponent: function() {
		var me = this,
			moduleRecord = me.optimaModule.getSdomainRecord() ;
		
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
					xtype:'op5crmbasemwbutton',
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
					//textCaption: '',
					iconCls: 'op5-crmbase-waitcircle',
					hidden: (!moduleRecord.get('auth_has_all') && !Ext.Array.contains(moduleRecord.get('auth_arrOpenActions'),'bible'))
				},{
					itemId: 'btn-files',
					textTitle: 'Data Files',
					//textCaption: '',
					iconCls: 'op5-crmbase-waitcircle',
					hidden: (!moduleRecord.get('auth_has_all') && !Ext.Array.contains(moduleRecord.get('auth_arrOpenActions'),'files'))
				},{
					itemId: 'btn-workflow',
					textTitle: 'Workflow',
					//textCaption: '',
					iconCls: 'op5-crmbase-mainwindow-workflow',
					menu: null,
					hidden: (!moduleRecord.get('auth_has_all'))
				},{
					itemId: 'btn-logs',
					textTitle: 'Logs / Notifications',
					//textCaption: '',
					iconCls: 'op5-crmbase-mainwindow-logs',
					menu: null,
					hidden: (!moduleRecord.get('auth_has_all'))
				}]
			}]
		}) ;
		
		me.on('afterrender',function(){
			var totHeight = 0 ;
			Ext.Array.each(me.child('toolbar').query('>button'),function(item) {
				if( item.isHidden() ) {
					return ;
				}
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
	},
	onLoadBible: function( response ) {
		var me = this,
			respObj = Ext.decode(response.responseText) ;
		
		var btnBible = me.child('toolbar').child('#btn-bible') ;
		
		var menuCfg = respObj.data_bible ;
		Ext.Array.each( menuCfg, function(o) {
			Ext.apply(o,{
				cls: o.isPublished ? me.clsForPublished : '' ,
				handler: function() {
					me.openBible( o.bibleId ) ;
				},
				scope:me
			}) ;
		},me) ;
		
		if( btnBible.menu ) {
			btnBible.menu.removeAll() ;
			btnBible.menu.add(menuCfg) ;
			
			if( respObj.auth_status && !respObj.auth_status.disableAdmin ) {
				btnBible.menu.add('-') ;
				btnBible.menu.add({
					icon: 'images/op5img/ico_new_16.gif' ,
					text: 'Define new Bible' ,
					handler : function() {
						me.openBibleDefineNew() ;
					},
					scope : me
				}) ;
			}
		}
		btnBible.setIconCls('op5-crmbase-mainwindow-bible') ;
		btnBible.setObjText({
			title: btnBible.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(menuCfg)
		});
	},
	onLoadFiles: function( response ) {
		var me = this,
			respObj = Ext.decode(response.responseText) ;
		
		var btnFiles = me.child('toolbar').child('#btn-files') ;
		
		var menuCfg = respObj.data_files ;
		Ext.Array.each( menuCfg, function(o) {
			Ext.apply(o,{
				cls: o.isPublished ? me.clsForPublished : '' ,
				handler: function() {
					me.openFile( o.fileId ) ;
				},
				scope:me
			}) ;
		},me) ;
		
		if( btnFiles.menu ) {
			btnFiles.menu.removeAll() ;
			btnFiles.menu.add(menuCfg) ;
			
			if( respObj.auth_status && !respObj.auth_status.disableAdmin ) {
				btnFiles.menu.add('-') ;
				btnFiles.menu.add({
					icon: 'images/op5img/ico_new_16.gif' ,
					text: 'Define new File' ,
					handler : function() {
						me.openFileDefineNew() ;
					},
					scope : me
				}) ;
			}
		}
		btnFiles.setIconCls('op5-crmbase-mainwindow-files') ;
		btnFiles.setObjText({
			title: btnFiles.getObjText().title,
			redcount: menuCfg.length,
			caption: me.getHeadlines(menuCfg)
		});
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
	},
	
	
	openFile: function( fileId ) {
		var me = this ;
		
		// recherche d'une fenetre deja ouverte
		var doOpen = true ;
		me.optimaModule.eachWindow(function(win){
			if( !(win instanceof Optima5.Modules.CrmBase.DataWindow) ) {
				return true ;
			}
			if( win.dataType == 'file' && win.fileId == fileId ) {
				win.show() ;
				win.focus() ;
				doOpen = false ;
				return false ;
			}
		},me) ;
		
		if( !doOpen ) {
			return ;
		}
		
		var win = me.optimaModule.createWindow({
			title: '',
			
			dataType:'file',
			fileId:fileId
		},Optima5.Modules.CrmBase.DataWindow) ;
	},
	openFileDefineNew: function() {
		var me = this ;
		Optima5.Modules.CrmBase.DataWindow.sOpenDefineWindow(me.optimaModule,'file',true) ;
	}
}) ;
