Ext.define('Optima5.Modules.CrmBase.Qwindow' ,{
	extend: 'Ext.window.Window',
	requires: [
		'Optima5.Modules.CrmBase.QwindowToolbar',
		'Optima5.Modules.CrmBase.QueryPanel',
		'Optima5.Modules.CrmBase.QmergePanel'
	],
	
	optimaModule: null,
	
	
	qType:'', /* 'query','qmerge' */
	
	queryId:null,
	queryNewFileId:null,
	
	qmergeId:null,
	qmergeNew:false,
	
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
		
		var cfgValid = false ;
		switch( me.qType ) {
			case 'query' :
				if( me.queryId > 0 || me.queryNewFileId != '' ) {
					Ext.apply(me,{
						items:[Ext.create('Optima5.Modules.CrmBase.QueryPanel',{
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
					Ext.apply(me,{
						items:[Ext.create('Optima5.Modules.CrmBase.QmergePanel',{
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
	
	getToolbar: function() {
		var me = this ;
		return me.child('#tbar');
	},
	getPanel: function() {
		var me = this ;
		switch( me.qType ) {
			case 'query' :
			case 'qmerge' :
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
					tbarIsNew=false, tbarDisableSave=false, tbarIsPublished=false ;

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
					default:
						return ;
				}
				
				// ** Set window title ***
				me.setTitle( me.optimaModule.getWindowTitle( winTitle ) ) ;
				
				// ** Configure toolbar **
				var tbar = me.getToolbar() ;
				var tbarFileMenu = tbar.child('#file') ;
				tbarFileMenu.menu.child('#save').setVisible(!tbarIsNew);
				tbarFileMenu.menu.child('#save').setDisabled(tbarDisableSave);
				tbarFileMenu.menu.child('#saveas').setVisible(true);
				tbarFileMenu.menu.child('#saveas').setDisabled(false);
				tbarFileMenu.menu.child('#delete').setDisabled(!tbarIsNew);
				tbarFileMenu.menu.child('#delete').setDisabled(tbarDisableSave);
				var tbarOptionsMenu = tbar.child('#options') ;
				tbarOptionsMenu.setVisible(!tbarIsNew);
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