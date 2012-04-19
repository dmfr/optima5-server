/*

This file is part of Ext JS 4

Copyright (c) 2011 Sencha Inc

Contact:  http://www.sencha.com/contact

GNU General Public License Usage
This file may be used under the terms of the GNU General Public License version 3.0 as published by the Free Software Foundation and appearing in the file LICENSE included in the packaging of this file.  Please review the following information to ensure the GNU General Public License version 3.0 requirements will be met: http://www.gnu.org/copyleft/gpl.html.

If you are unsure which license is appropriate for your use, please contact the sales department at http://www.sencha.com/contact.

*/
/*!
 * Ext JS Library 4.0
 * Copyright(c) 2006-2011 Sencha Inc.
 * licensing@sencha.com
 * http://www.sencha.com/license
 */

Ext.define('Optima5.CoreDesktop.OptimaDesktop', {
    extend: 'Ext.ux.desktop.App',
			  
    requires: [
        'Ext.window.MessageBox',

        'Ext.ux.desktop.ShortcutModel',

        //'MyDesktop.SystemStatus',
		 'Optima5.Modules.ParaCRM.AppWindow',
		 'Optima5.Modules.Notepad.NotepadWindow'
        //'MyDesktop.VideoWindow',
        //'MyDesktop.GridWindow',
        //'MyDesktop.TabWindow',
        //'MyDesktop.AccordionWindow',
        //'MyDesktop.Notepad',
        //'MyDesktop.BogusMenuModule',
        //'MyDesktop.BogusModule',

//        'MyDesktop.Blockalanche',
        //'MyDesktop.Settings'
    ],

		wallpaper : null ,

    init: function() {
		 var me = this ;
        // custom logic before getXYZ methods get called...
		  
		  Optima5.CoreDesktop.Ajax.request({
				url: 'server/login.php',
				params: {
					_action: 'login',
					login_domain: 'paramount',
					login_user  : 'damien',
					login_password: '1806'
				},
				succCallback: function(response) {
					if( Ext.decode(response.responseText).done == false ) {
						this.desktop.destroy() ;
						if( Ext.decode(response.responseText).errors )
							var mstr = Ext.decode(response.responseText).errors.join('\n') ;
						else
							var mstr = 'Cannot open session. Contact admin.' ;
						Ext.Msg.alert('Initialization error', mstr,function(){
							window.location.reload() ;
						}) ;
						return ;
					}
					
					
					op5session.removeAll() ;
					/*
					Ext.iterate( Ext.decode(response.responseText).login_data , function(key,val){
						op5session.add(key,val) ;
					}) ;
					*/
					op5session.addAll(Ext.decode(response.responseText).login_data) ;
					me.setWallpaper(op5session.get('wallpaper_url')) ;
					
					Ext.apply(me,{
						title: 'PouetPouet'
					});
				},
				scope : me
			});
			
        this.callParent();
    },

    getModules : function(){
        return [
        		new Optima5.Modules.ParaCRM.AppWindow(),
        		new Optima5.Modules.Notepad.NotepadWindow()
        ];
    },
			  
	setWallpaper : function(wallp){
        var me = this ;

		  me.desktop.setWallpaper( wallp , false ) ;
	},

    getDesktopConfig: function () {
        var me = this, ret = me.callParent();

        return Ext.apply(ret, {
            //cls: 'ux-desktop-black',

            contextMenuItems: [
                { text: 'Change Settings', handler: me.onSettings, scope: me }
            ],

            shortcuts: Ext.create('Ext.data.Store', {
                model: 'Ext.ux.desktop.ShortcutModel',
                data: [
                    { name: 'ParaCRM', iconCls: 'paracrm-shortcut', module: 'paracrm' },
                    { name: 'Notepad', iconCls: 'notepad-shortcut', module: 'notepad' },
                    { name: 'System Status', iconCls: 'cpu-shortcut', module: 'systemstatus'}
                ]
            }),

            wallpaper: null ,
            wallpaperStretch: false
        });
    },

    // config for the start menu
    getStartConfig : function() {
        var me = this, ret = me.callParent();

        return Ext.apply(ret, {
            title: 'Damien Mirand',
            iconCls: 'user',
            height: 300,
            toolConfig: {
                width: 100,
                items: [
                    {
                        text:'Settings',
                        iconCls:'settings',
                        handler: me.onSettings,
                        scope: me
                    },
                    '-',
                    {
                        text:'Logout',
                        iconCls:'logout',
                        handler: me.onLogout,
                        scope: me
                    }
                ]
            }
        });
    },

    getTaskbarConfig: function () {
        var ret = this.callParent();

        return Ext.apply(ret, {
            quickStart: [
                { name: 'Accordion Window', iconCls: 'accordion', module: 'acc-win' },
                { name: 'Grid Window', iconCls: 'icon-grid', module: 'grid-win' }
            ],
            trayItems: [
                { xtype: 'trayclock', flex: 1 , timeFormat:'d/m H:i' }
            ]
        });
    },

    onLogout: function () {
		 var me = this ;
        Ext.Msg.confirm('Logout', 'Are you sure you want to logout?', function(btn){
			  if( btn == 'yes' ){
					Ext.Ajax.request({
							url: 'server/login.php',
							params: {
								_action: 'logout',
								_sessionName: op5session.get('session_id')
							},
							success: function(response) {
								me.desktopCloseAllWindows() ;
								me.desktop.destroy() ;
								op5session.removeAll() ;
								var zmsg = '' ;
								if( Ext.decode(response.responseText).done == true ) {
									zmsg = 'Successfully logged out.' ;
								}
								else {
									zmsg = 'Cannot delete session. Timed out ?' ;
								}
								Ext.Msg.alert('End session',zmsg, function(){
									// window.close() ;
								});
							},
							scope : me
						});
			  }
		  });
    },
			  
	onSessionInvalid: function () {
		var me = this ;
		me.desktopCloseAllWindows() ;
		me.desktop.destroy() ;
		op5session.removeAll() ;
		Ext.Msg.alert('Session closed', 'Your session has been terminated',function(){
			window.location.reload() ;
		}) ;
	},

    onSettings: function () {
        var dlg = new MyDesktop.Settings({
            desktop: this.desktop
        });
        dlg.show();
    },
    
	desktopCloseAllWindows: function() {
		if( zmgr = this.desktop.getDesktopZIndexManager() ) {
        zmgr.eachBottomUp(function(win) {
            if (win.isWindow) {
                win.close() ;
            }
        });
		}
    }
		
});

