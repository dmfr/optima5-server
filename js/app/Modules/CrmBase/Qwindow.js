Ext.define('Optima5.Modules.CrmBase.Qwindow' ,{
	extend: 'Ext.window.Window',
	requires: [
		'Optima5.Modules.CrmBase.QwindowToolbar',
		'Optima5.Modules.CrmBase.QueryPanel',
		'Optima5.Modules.CrmBase.QmergePanel',
		'Optima5.Modules.CrmBase.QbookPanel',
		'Optima5.Modules.CrmBase.QsimplePanel'
	],
	
	optimaModule: null,
	
	
	qType:'', /* 'query','qmerge' */
	
	queryId:null,
	queryNewFileId:null,
	
	qmergeId:null,
	qmergeNew:false,
	
	qbookId:null,
	qbookNew:false,
	
	qwebId:null,
	
	forceQsimple: false,
		
	getQcfg: function() {
		var me = this ;
		
		var qCfg = {}
		switch( me.qType ) {
			case 'query' :
				qCfg['qType'] = me.qType ;
				if( me.queryId == null ) {
					qCfg['queryNewFileId'] = me.queryNewFileId ;
				} else {
					qCfg['queryId'] = me.queryId ;
				}
				return qCfg ;
				break ;
			case 'qmerge' :
				qCfg['qType'] = me.qType ;
				if( me.qmergeId == null ) {
					qCfg['qmergeNew'] = true ;
				} else {
					qCfg['qmergeId'] = me.qmergeId ;
				}
				return qCfg ;
				break ;
			case 'qbook' :
				qCfg['qType'] = me.qType ;
				if( me.qbookId == null ) {
					qCfg['qbookNew'] = true ;
				} else {
					qCfg['qbookId'] = me.qbookId ;
				}
				return qCfg ;
				break ;
			case 'qweb' :
				qCfg['qType'] = me.qType ;
				qCfg['qwebId'] = me.qwebId ;
				return qCfg ;
				break ;
			default:
				return null ;
				break ;
		}
	},
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:Qwindow','No module reference ?') ;
		}
		
		var cfgValid = false,
			panelClass ;
		switch( me.qType ) {
			case 'query' :
				if( me.queryId > 0 || me.queryNewFileId != '' ) {
					panelClass = 'Optima5.Modules.CrmBase.QueryPanel' ;
					if( me.forceQsimple ) {
						panelClass = 'Optima5.Modules.CrmBase.QsimplePanel' ;
					}
					Ext.apply(me,{
						items:[Ext.create(panelClass,{
							itemId:'qPanel',
							optimaModule: me.optimaModule,
							listeners: {
								querysaved: function( success, queryId ) {
									if( success ) {
										me.onQuerySaved(queryId);
									}
								},
								querydelete: function( success ) {
									if( success ) {
										me.close();
									}
								},
								scope:me
							}
						})]
					}) ;
					cfgValid = true ;
				}
				break ;
				
			case 'qmerge' :
				if( me.qmergeId || me.qmergeNew ) {
					panelClass = 'Optima5.Modules.CrmBase.QmergePanel' ;
					if( me.forceQsimple ) {
						panelClass = 'Optima5.Modules.CrmBase.QsimplePanel' ;
					}
					Ext.apply(me,{
						items:[Ext.create(panelClass,{
							itemId:'qPanel',
							optimaModule: me.optimaModule,
							listeners: {
								querysaved: function( success, qmergeId ) {
									if( success ) {
										me.onQmergeSaved(qmergeId);
									}
								},
								querydelete: function( success ) {
									if( success ) {
										me.close();
									}
								},
								scope:me
							}
						})]
					}) ;
					cfgValid = true ;
				}
				break ;
				
			case 'qbook' :
				if( me.qbookId || me.qbookNew ) {
					panelClass = 'Optima5.Modules.CrmBase.QbookPanel' ;
					if( me.forceQsimple ) {
						panelClass = 'Optima5.Modules.CrmBase.QsimplePanel' ;
					}
					Ext.apply(me,{
						items:[Ext.create(panelClass,{
							itemId:'qPanel',
							optimaModule: me.optimaModule,
							listeners: {
								querysaved: function( success, qmergeId ) {
									if( success ) {
										me.onQbookSaved(qmergeId);
									}
								},
								querydelete: function( success ) {
									if( success ) {
										me.close();
									}
								},
								qbookztemplatechange: function() {
									me.configureComponents(true) ;
								},
								backendfilerecordchange: function(fileCode, filerecordId) {
									me.setToolbarQbookBackendFilerecord(fileCode,filerecordId) ;
								},
								scope:me
							}
						})]
					}) ;
					cfgValid = true ;
				}
				break ;
				
			case 'qweb' :
				if( me.qwebId > 0 ) {
					Ext.apply(me,{
						items:[Ext.create('Optima5.Modules.CrmBase.QsimplePanel',{
							itemId:'qPanel',
							optimaModule: me.optimaModule
						})]
					}) ;
					cfgValid = true ;
				}
				break ;
				
			default : break ;
		}
		if( !cfgValid ) {
			Optima5.Helper.logError('CrmBase:Qwindow','Invalid config') ;
		}
		
		Ext.apply(me,{
			tbar: Ext.create('Optima5.Modules.CrmBase.QwindowToolbar',{
				itemId:'tbar',
				optimaModule: me.optimaModule,
				qType: me.qType,
				listeners:{
					toolbaritemclick: me.onToolbarItemClick,
					scope:me
				}
			})
		}) ;
		
		switch( Ext.getClassName(me.items[0]) ) {
			case 'Optima5.Modules.CrmBase.QsimplePanel' :
				Ext.apply(me,{
					width:800,
					height:350
				}) ;
				break ;
				
			default :
				Ext.apply(me,{
					width:800,
					height:700
				}) ;
				break ;
		}
		
		me.on('show', function() {
			// configure panel + load data
			me.configureComponents() ;
		},me,{single:true}) ;
		
		me.callParent() ;
		
		me.mon(me.optimaModule,'op5broadcast',me.onCrmeventBroadcast,me) ;
	},
	onCrmeventBroadcast: function( crmEvent, eventParams ) {
		var me = this ;
		switch( crmEvent ) {
			case 'togglepublishquery' :
				break ;
			
			default :
				return ;
		}
		
		switch( crmEvent ) {
			case 'togglepublishquery' :
				return me.configureComponents(true) ;
		}
	},
	onQuerySaved: function( queryId ) {
		var me = this ;
		me.qType = 'query' ;
		me.queryNewFileId = null ;
		me.queryId = queryId ;
		
		me.configureComponents() ;
	},
	onQmergeSaved: function( qmergeId ) {
		var me = this ;
		me.qType = 'qmerge' ;
		me.qmergeNew = false ;
		me.qmergeId = qmergeId ;
		
		me.configureComponents() ;
	},
	onQbookSaved: function( qbookId ) {
		var me = this ;
		me.qType = 'qbook' ;
		me.qbookNew = false ;
		me.qbookId = qbookId ;
		
		me.configureComponents() ;
	},
	
	getToolbar: function() {
		var me = this ;
		return me.child('#tbar');
	},
	getPanel: function() {
		var me = this ;
		switch( me.qType ) {
			case 'query' :
			case 'qmerge' :
			case 'qbook' :
			case 'qweb' :
				return me.child('#qPanel') ;
			default :
				return null ;
		}
	},
	
	configureComponents: function( toolbarOnly ) {
		var me = this ,
			params = {} ;
			
		if( !toolbarOnly ) {
			switch( me.qType ) {
				case 'query' :
					if( me.queryNewFileId ) {
						me.getPanel().queryNew(me.queryNewFileId) ;
					} else if( me.queryId > 0 ) {
						me.getPanel().queryOpen(me.queryId) ;
					}
					break ;
				case 'qmerge' :
					if( me.qmergeNew ) {
						me.getPanel().qmergeNew() ;
					} else if( me.qmergeId > 0 ) {
						me.getPanel().qmergeOpen(me.qmergeId) ;
					}
					break ;
				case 'qbook' :
					if( me.qbookNew ) {
						me.getPanel().qbookNew() ;
					} else if( me.qbookId > 0 ) {
						me.getPanel().qbookOpen(me.qbookId) ;
					}
					break ;
				case 'qweb' :
					me.getPanel().qwebOpen(me.qwebId) ;
					break ;
				default:
					return ;
			}
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: 'queries_getToolbarData'
			},
			success: function(response) {
				var ajaxData = Ext.decode(response.responseText),
					winTitle,
					tbarDisableFile=false, tbarIsNew=false, tbarDisableSave=false, tbarIsPublished=false,
					qbookArrZtemplate = null ;
				
				var authReadOnly=false,
						authDisableAdmin=false;
				if( ajaxData.auth_status ) {
					if( ajaxData.auth_status.disableAdmin ) {
						authDisableAdmin = true ;
					}
					if( ajaxData.auth_status.readOnly ) {
						authReadOnly = true ;
					}
				}
				
				switch( me.qType ) {
					case 'query' :
						if( me.queryNewFileId ) {
							tbarIsNew = tbarDisableSave = true ;
							Ext.Array.each( ajaxData.data_filetargets, function(o) {
								if( o.fileId == me.queryNewFileId ) {
									winTitle = 'Q# New on #'+o.text ;
									if( o.isPublished ) {
										tbarDisableSave = tbarIsPublished = true ;
									}
									return false ;
								}
							});
						} else if( me.queryId > 0 ) {
							Ext.Array.each( ajaxData.data_queries, function(o) {
								if( o.queryId == me.queryId ) {
									winTitle = 'Q# '+o.text ;
									if( o.isPublished ) {
										tbarDisableSave = tbarIsPublished = true ;
									}
									return false ;
								}
							});
						}
						break ;
					case 'qmerge' :
						if( me.qmergeNew ) {
							tbarIsNew = tbarDisableSave = true ;
							winTitle = 'Q# '+'New Qmerge' ;
						} else if( me.qmergeId > 0 ) {
							Ext.Array.each( ajaxData.data_qmerges, function(o) {
								if( o.qmergeId == me.qmergeId ) {
									winTitle = 'Q# '+o.text ;
									if( o.isPublished ) {
										tbarDisableSave = tbarIsPublished = true ;
									}
									return false ;
								}
							});
						}
						break ;
					case 'qbook' :
						if( me.qbookNew ) {
							tbarIsNew = tbarDisableSave = true ;
							winTitle = 'Q# '+'New Qbook' ;
						} else if( me.qbookId > 0 ) {
							Ext.Array.each( ajaxData.data_qbooks, function(o) {
								if( o.qbookId == me.qbookId ) {
									winTitle = 'Q# '+o.text ;
									if( o.isPublished ) {
										tbarDisableSave = tbarIsPublished = true ;
									}
									qbookArrZtemplate = o.arr_ztemplate ;
									return false ;
								}
							});
						}
						break ;
					case 'qweb' :
						tbarDisableFile = tbarDisableSave = true ;
						Ext.Array.each( ajaxData.data_qwebs, function(o) {
							if( o.qwebId == me.qwebId ) {
								winTitle = 'Q# '+o.text ;
								if( o.isPublished ) {
									tbarIsPublished = true ;
								}
								return false ;
							}
						});
						break ;
					default:
						return ;
				}
				
				// ** Set window title ***
				me.setTitle( me.optimaModule.getWindowTitle( winTitle ) ) ;
				
				// ** Configure toolbar **
				var tbar = me.getToolbar() ;
				
				var tbarFileMenu = tbar.child('#file') ;
				tbarFileMenu.setVisible(!tbarDisableFile && !authReadOnly) ;
				tbarFileMenu.menu.child('#save').setVisible(!tbarIsNew);
				tbarFileMenu.menu.child('#save').setDisabled(tbarDisableSave);
				tbarFileMenu.menu.child('#saveas').setVisible(true);
				tbarFileMenu.menu.child('#saveas').setDisabled(false);
				tbarFileMenu.menu.child('#delete').setDisabled(!tbarIsNew);
				tbarFileMenu.menu.child('#delete').setDisabled(tbarDisableSave);
				
				var tbarRunBtn = tbar.child('#run'),
					tbarRunQbookMenu = tbar.child('#run-qbook'),
					isQbook = (me.qType=='qbook') ;
				tbarRunBtn.setVisible( !isQbook ) ;
				tbarRunQbookMenu.setVisible( isQbook ) ;
				if( isQbook ) {
					var runQbookMenuItems = [] ;
					if( true ) {
						runQbookMenuItems.push({
							itemId: 'txtBackendFilerecord',
							text: 'No current filerecord',
							disabled: true
						}) ;
						runQbookMenuItems.push('-') ;
					}
					runQbookMenuItems.push({
						itemId: 'run',
						text: 'Run Query',
						iconCls: 'op5-crmbase-qtoolbar-run',
						handler: tbar.onItemClick,
						scope: tbar
					});
					if( qbookArrZtemplate != null && qbookArrZtemplate.length > 0 ) {
						runQbookMenuItems.push('-') ;
						for( var i=0 ; i<qbookArrZtemplate.length ; i++ ) {
							runQbookMenuItems.push({
								itemId: 'run-ztemplate-'+qbookArrZtemplate[i]['qbook_ztemplate_ssid'],
								text: qbookArrZtemplate[i]['ztemplate_name'],
								iconCls: 'op5-crmbase-qtoolbar-ztemplate',
								handler: tbar.onItemClick,
								scope: tbar
							});
						}
					}
					
					tbarRunQbookMenu.menu.removeAll() ;
					tbarRunQbookMenu.menu.add(runQbookMenuItems) ;
				}
				
				var tbarOptionsMenu = tbar.child('#options') ;
				tbarOptionsMenu.setVisible(!tbarIsNew && !authDisableAdmin);
				if( tbarIsPublished ) {
					tbarOptionsMenu.menu.child('#toggle-android').setChecked(true,true) ;
					tbarOptionsMenu.menu.child('#toggle-android').addCls(tbar.clsForPublished) ;
				} else {
					tbarOptionsMenu.menu.child('#toggle-android').setChecked(false,true) ;
					tbarOptionsMenu.menu.child('#toggle-android').removeCls(tbar.clsForPublished) ;
				}
			},
			scope: me
		});
	},
	setToolbarQbookBackendFilerecord: function( fileCode, filerecordId ) {
		var me = this,
			tbar = me.getToolbar(),
			tbarRunQbookMenu = tbar.child('#run-qbook').menu,
			backendFilerecordMenuItem = tbarRunQbookMenu.child('#txtBackendFilerecord') ;
		
		if( backendFilerecordMenuItem == null ) {
			return ;
		}
		
		if( filerecordId == null ) {
			backendFilerecordMenuItem.removeCls('op5-crmbase-qbook-srcfilerecord-menuitem') ;
			backendFilerecordMenuItem.setText( 'No current filerecord' ) ;
			backendFilerecordMenuItem.setDisabled(true) ;
			return ;
		}
		
		backendFilerecordMenuItem.addCls('op5-crmbase-qbook-srcfilerecord-menuitem') ;
		backendFilerecordMenuItem.setText( fileCode+' :: #'+filerecordId ) ;
		backendFilerecordMenuItem.setDisabled(false) ;
	},
	
	onToolbarItemClick: function( menuId, menuItemId, input ) {
		var me = this ;
		//console.log(menuId+':'+menuItemId+' '+input) ;
		switch( menuId ) {
			case 'file' :
				switch( menuItemId ) {
					case 'save' :
					case 'saveas' :
						return me.getPanel().remoteAction(menuItemId,input) ;
					case 'delete' :
						Ext.Msg.confirm('Delete query','Delete this query ?',function() {
							return me.getPanel().remoteAction('delete') ;
						},me) ;
					default : break ;
				}
				break ;
				
			case 'run' :
				return me.getPanel().remoteAction('run') ;
				
			case 'run-qbook' :
				if( menuItemId == 'run' ) {
					return me.getPanel().remoteAction('run') ;
				}
				var splitMenuItemId = menuItemId.split('-') ;
				if( splitMenuItemId.length == 3 && splitMenuItemId[1] == 'ztemplate' ) {
					return me.getPanel().remoteAction('run',{qbookZtemplateSsid:splitMenuItemId[2]}) ;
				}
				return null ;
				
			case 'options' :
				switch( menuItemId ) {
					case 'toggle-android' :
						var checked = input ;
						return me.getPanel().remoteAction('toggle_publish',checked) ;
					default : break ;
				}
				break ;
		}
	}
});