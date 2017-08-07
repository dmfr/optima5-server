Ext.define('Optima5.Modules.CrmBase.Qwindow' ,{
	extend: 'Ext.window.Window',
	requires: [
		'Optima5.Modules.CrmBase.QwindowToolbar',
		'Optima5.Modules.CrmBase.QueryPanel',
		'Optima5.Modules.CrmBase.QmergePanel',
		'Optima5.Modules.CrmBase.QbookPanel',
		'Optima5.Modules.CrmBase.QsimplePanel',
		'Optima5.Modules.CrmBase.QsqlPanel',
		'Optima5.Modules.CrmBase.QwindowAutorunForm'
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
		
	transaction_id: null,
	qresultWindows: null,
		
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
			case 'qsql' :
				qCfg['qType'] = me.qType ;
				if( me.qsqlId == null ) {
					qCfg['qsqlNew'] = true ;
				} else {
					qCfg['qsqlId'] = me.qsqlId ;
				}
				return qCfg ;
				break ;
			default:
				return null ;
				break ;
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
			case 'qsql' :
				return 'queries_qsqlTransaction' ;
			case 'qbook' :
			case 'qbook_ztemplate' :
				return 'queries_qbookTransaction' ;
			default :
				Optima5.Helper.logError('CrmBase:Qwindow','Invalid config') ;
				break ;
		}
	},
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:Qwindow','No module reference ?') ;
		}
		
		me.qresultWindows = new Ext.util.MixedCollection();
		
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
				
			case 'qsql' :
				if( me.qsqlId || me.qsqlNew ) {
					panelClass = 'Optima5.Modules.CrmBase.QsqlPanel' ;
					Ext.apply(me,{
						items:[Ext.create(panelClass,{
							itemId:'qPanel',
							optimaModule: me.optimaModule,
							listeners: {
								querysaved: function( success, qsqlId ) {
									if( success ) {
										me.onQsqlSaved(qsqlId);
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
				
			case 'Optima5.Modules.CrmBase.QsqlPanel' :
				Ext.apply(me,{
					width:1000,
					height:700
				}) ;
				break ;
				
			default :
				Ext.apply(me,{
					width:800,
					height:700
				}) ;
				break ;
		}
		me.items[0].on('qtransactionopen',function(qpanel, transactionId) {
			me.onTransactionOpen(transactionId) ;
		},me) ;
		me.items[0].on('qresultready',function(qpanel, transactionId, RES_id, qbook_ztemplate_ssid) {
			if( transactionId != me.transaction_id ) {
				return ;
			}
			me.onResultReady(RES_id, qbook_ztemplate_ssid) ;
		},me) ;
		
		me.on('show', function() {
			// configure panel + load data
			me.configureComponents() ;
		},me,{single:true}) ;
		
		me.callParent() ;
		me.on('beforeclose',this.onBeforeClose,this) ;
		
		me.mon(me.optimaModule,'op5broadcast',me.onCrmeventBroadcast,me) ;
	},
	onCrmeventBroadcast: function( crmEvent, eventParams ) {
		var me = this ;
		switch( crmEvent ) {
			case 'togglepublishquery' :
			case 'toggleautorunquery' :
				break ;
			
			default :
				return ;
		}
		
		switch( crmEvent ) {
			case 'togglepublishquery' :
			case 'toggleautorunquery' :
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
	onQsqlSaved: function( qsqlId ) {
		var me = this ;
		me.qType = 'qsql' ;
		me.qsqlNew = false ;
		me.qsqlId = qsqlId ;
		
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
			case 'qsql' :
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
				case 'qsql' :
					if( me.qsqlNew ) {
						me.getPanel().qsqlNew() ;
					} else if( me.qsqlId > 0 ) {
						me.getPanel().qsqlOpen(me.qsqlId) ;
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
					tbarDisableFile=false, tbarIsNew=false, tbarDisableSave=false, tbarIsPublished=false, tbarIsAutorun=false,
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
					case 'qsql' :
						if( me.qsqlNew ) {
							tbarIsNew = tbarDisableSave = true ;
							winTitle = 'Q# '+'New Qsql' ;
						} else if( me.qsqlId > 0 ) {
							Ext.Array.each( ajaxData.data_qsqls, function(o) {
								if( o.qsqlId == me.qsqlId ) {
									winTitle = 'Q# '+o.text ;
									if( o.isPublished ) {
										tbarDisableSave = tbarIsPublished = true ;
									}
									if( o.isAutorun ) {
										tbarDisableSave = tbarIsAutorun = true ;
										tbarCfgAutorun = o.cfgAutorun ;
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
					isQbook = (me.qType=='qbook'),
					isQsql = (me.qType=='qsql') ;
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
				
				var tbarZtemplatesBtn = tbar.child('#ztemplates') ;
				tbarZtemplatesBtn.setVisible(isQbook) ;
				
				var tbarOptionsMenu = tbar.child('#options') ;
				tbarOptionsMenu.setVisible(!tbarIsNew && !authDisableAdmin);
				if( tbarIsPublished ) {
					tbarOptionsMenu.menu.child('#toggle-android').setChecked(true,true) ;
					tbarOptionsMenu.menu.child('#toggle-android').addCls(tbar.clsForPublished) ;
				} else {
					tbarOptionsMenu.menu.child('#toggle-android').setChecked(false,true) ;
					tbarOptionsMenu.menu.child('#toggle-android').removeCls(tbar.clsForPublished) ;
				}
				tbarOptionsMenu.menu.child('#setup-autorun').setVisible(isQsql) ;
				if( tbarIsAutorun ) {
					tbarOptionsMenu.menu.child('#setup-autorun').addCls(tbar.clsForAutorun) ;
					var text = tbarOptionsMenu.menu.child('#setup-autorun').textTpl ;
					switch(tbarCfgAutorun['autorun_mode']) {
						case 'schedule' :
							text += ' : start at '+tbarCfgAutorun['autorun_schedule_time'] ;
							break ;
						case 'repeat' :
							text += ' : repeat '+tbarCfgAutorun['autorun_repeat_mndelay']+' mn' ;
							break ;
						default :
							break ;
					}
					tbarOptionsMenu.menu.child('#setup-autorun').setText( text ) ;
				} else {
					tbarOptionsMenu.menu.child('#setup-autorun').removeCls(tbar.clsForAutorun) ;
					tbarOptionsMenu.menu.child('#setup-autorun').setText( tbarOptionsMenu.menu.child('#setup-autorun').textTpl ) ;
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
				
			case 'ztemplates' :
				if( (me.qType=='qbook') && typeof me.getPanel().doZtemplates == 'function' ) {
					me.getPanel().doZtemplates() ;
				}
				return null ;
				
			case 'options' :
				switch( menuItemId ) {
					case 'toggle-android' :
						var checked = input ;
						return me.getPanel().remoteAction('toggle_publish',checked) ;
					case 'setup-autorun' :
						return me.getPanel().remoteAction('setup_autorun') ;
					default : break ;
				}
				break ;
		}
	},
	
	
	onTransactionOpen: function( transactionId ) {
		if( this.transaction_id != null ) {
			this.doCleanup() ;
		}
		this.transaction_id = transactionId ;
	},
	onResultReady: function( RES_id, qbook_ztemplate_ssid ) {
		var me = this ;
		
		var baseAjaxParams = new Object() ;
		Ext.apply( baseAjaxParams, {
			_action: 'queries_builderTransaction',
			_transaction_id : me.transaction_id
		});
		var queryResultPanel = Ext.create('Optima5.Modules.CrmBase.QueryResultPanel',{
			optimaModule:me.optimaModule,
			ajaxBaseParams: {
				_action: me.getAjaxAction(),
				_transaction_id : me.transaction_id
			},
			RES_id: RES_id,
			qbook_ztemplate_ssid: qbook_ztemplate_ssid
		}) ;
		
		var windowTitle = '' ;
		switch( me.qType ) {
			case 'query' :
				windowTitle = me.getPanel().query_name ;
				break ;
			case 'qmerge' :
				windowTitle = me.getPanel().qmerge_name ;
				break ;
			case 'qweb' :
				windowTitle = me.getPanel().qweb_name ;
				break ;
			case 'qsql' :
				windowTitle = me.getPanel().qsql_name ;
				break ;
			case 'qbook' :
				windowTitle = me.getPanel().qbook_name ;
				break ;
		}
		var windowCfg = {
			title:windowTitle ,
			width:800,
			height:600,
			iconCls: 'op5-crmbase-qresultwindow-icon',
			animCollapse:false,
			border: false,
			RES_id: RES_id,
			items: [ queryResultPanel ]
		} ;
		if( me.qType=='qweb' ) {
			Ext.apply(windowCfg,{
				width:925,
				height:700
			}) ;
		}
		Ext.apply(windowCfg,{
			listeners: {
				beforeclose: function(win) {
					me.doCleanupResult(win.RES_id) ;
				},
				destroy: function(win) {
					me.qresultWindows.remove(win) ;
				},
				scope: me
			}
		}) ;
		
		var win = me.optimaModule.createWindow(windowCfg) ;
		me.qresultWindows.add(win) ;
	},
	doCleanup: function() {
		// close result windows
		this.qresultWindows.each( function(win) {
			win.destroy() ;
		}) ;
		
		// end transaction
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: this.getAjaxAction(),
				_transaction_id: this.transaction_id ,
				_subaction: 'end'
			}
		});
	},
	doCleanupResult: function(RES_id) {
		// destory result
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_action: this.getAjaxAction(),
				_transaction_id: this.transaction_id ,
				_subaction: 'res_destroy',
				RES_id: RES_id
			}
		});
	},
	onBeforeClose: function() {
		if( this.getPanel().isDirty && this.getPanel().isDirty() && !this.acceptClose ) {
			Ext.Msg.confirm('Not saved ?','Query was modified. Quit anyway ?',function(btn){
				if( btn=='yes' ) {
					this.acceptClose = true ;
					this.close() ;
				}
			},this);
			return false ;
		}
		return true ;
	},
	onDestroy: function() {
		this.doCleanup() ;
		this.callParent() ;
	}
});
