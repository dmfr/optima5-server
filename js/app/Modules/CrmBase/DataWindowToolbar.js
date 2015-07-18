Ext.define('Optima5.Modules.CrmBase.DataWindowToolbar' ,{
	extend: 'Ext.toolbar.Toolbar',
	
	clsForPublished: 'op5-crmbase-published',
	
	initComponent: function() {
		var me = this ;
		Ext.apply( this , {
			items : [{
				hidden: true,
				itemId: 'new',
				text: 'New',
				iconCls: 'op5-crmbase-datatoolbar-new',
				handler:me.onItemClick,
				scope:me
			},{
				itemId: 'file',
				text: 'File',
				iconCls: 'op5-crmbase-datatoolbar-file',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:me.onItemClick,
						scope:me
					},
					items: [{
						itemId: 'importdata',
						text: 'Import data',
						iconCls: 'op5-crmbase-datatoolbar-file-importdata'
					},{
						xtype: 'menuseparator'
					},{
						itemId: 'export-excel',
						text: 'Excel export',
						iconCls: 'op5-crmbase-datatoolbar-file-export-excel'
					},{
						itemId: 'export-gallery',
						text: 'DL gallery as zip',
						iconCls: 'op5-crmbase-datatoolbar-file-export-gallery'
					}]
				}
			},{
				itemId: 'view',
				text: 'View',
				iconCls: 'op5-crmbase-datatoolbar-view',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:me.onItemClick,
						scope:me
					},
					items: [{
						itemId: 'calendar',
						text: 'Calendar',
						iconCls: 'op5-crmbase-datatoolbar-view-calendar'
					},{
						itemId: 'grid',
						text: 'Grid data',
						iconCls: 'op5-crmbase-datatoolbar-view-grid'
					},{
						itemId: 'editgrid',
						text: 'Editable grid',
						iconCls: 'op5-crmbase-datatoolbar-view-editgrid'
					},{
						itemId: 'gmap',
						text: 'GMap/locations',
						iconCls: 'op5-crmbase-datatoolbar-view-gmap'
					},{
						itemId: 'gallery',
						text: 'Img Gallery',
						iconCls: 'op5-crmbase-datatoolbar-view-gallery'
					}]
				}
			},{
				hidden: true,
				itemId: 'options',
				text: 'Options',
				iconCls: 'op5-crmbase-datatoolbar-options',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:me.onItemClick,
						scope:me
					},
					items: [{
						itemId: 'toggle-android',
						text: 'Publish to Android',
						handler: null,
						checked: false,
						checkHandler : me.onCheckItemChange,
						scope: me
					},{
						itemId: 'definestore',
						text: 'Store Cfg',
						iconCls: 'op5-crmbase-datatoolbar-options-definestore'
					},{
						itemId: 'truncatestore',
						text: 'Truncate Store',
						iconCls: 'op5-crmbase-datatoolbar-options-truncatestore',
						hidden: true
					},{
						itemId: 'dropstore',
						text: 'Drop Store',
						iconCls: 'op5-crmbase-datatoolbar-options-dropstore',
						hidden: true
					}]
				}
			},'->',{
				hidden: true,
				itemId: 'refresh',
				text: 'Refresh',
				iconCls: 'op5-crmbase-datatoolbar-refresh',
				handler:me.onItemClick,
				scope:me
			}]
		});
		// console.dir(this.bibleMenu.items) ;
		this.callParent() ;
	},
	
	reconfigure: function( ajaxData, authStatus ) {
		var me = this ;
		
		// menu File
		var fileMenu = me.child('#file') ;
		fileMenu.menu.hide() ;
		if( typeof ajaxData.fileId !== 'undefined' ) {
			fileMenu.setVisible(true) ;
			fileMenu.menu.child('#export-excel').setVisible(true) ;
			fileMenu.menu.child('#export-gallery').setVisible( ajaxData.viewmode_gallery ) ;
		} else if( typeof ajaxData.bibleId !== 'undefined' ) {
			fileMenu.setVisible(true) ;
			fileMenu.menu.child('menuseparator').setVisible(false) ;
			fileMenu.menu.child('#export-excel').setVisible(false) ;
			fileMenu.menu.child('#export-gallery').setVisible(false) ;
		} else {
			fileMenu.setVisible(false) ;
		}
		
		var viewMenu = me.child('#view') ;
		viewMenu.menu.hide() ;
		viewMenu.setVisible(true) ;
		viewMenu.menu.child('#grid').setVisible( ajaxData.viewmode_grid ) ;
		viewMenu.menu.child('#editgrid').setVisible( ajaxData.viewmode_editgrid ) ;
		viewMenu.menu.child('#calendar').setVisible( ajaxData.viewmode_calendar ) ;
		viewMenu.menu.child('#gmap').setVisible( ajaxData.viewmode_gmap ) ;
		viewMenu.menu.child('#gallery').setVisible( ajaxData.viewmode_gallery ) ;
		
		var optionsMenu = me.child('#options') ;
		optionsMenu.menu.hide() ;
		if( authStatus != null && authStatus.disableAdmin ) {
			optionsMenu.setVisible(false) ;
		} else {
			optionsMenu.setVisible(true) ;
		}
		optionsMenu.menu.child('#toggle-android').setChecked( ajaxData.isPublished, true ) ;
		if( ajaxData.isPublished ) {
			optionsMenu.menu.child('#toggle-android').addCls( me.clsForPublished ) ;
		} else {
			optionsMenu.menu.child('#toggle-android').removeCls( me.clsForPublished ) ;
		}
		
		var refreshBtn = me.child('#refresh') ;
		refreshBtn.setVisible(true) ;
	},
	enableNew: function( bool ) {
		var me = this ;
		me.child('#new').setVisible(bool) ;
	},
	enableTruncateStore: function( bool ) {
		var me = this ;
		me.child('#options').menu.child('#truncatestore').setVisible(bool) ;
	},
	enableDropStore: function( bool ) {
		var me = this ;
		me.child('#options').menu.child('#dropstore').setVisible(bool) ;
	},
	
	onItemClick:function( item ) {
		var menuItem, toolbarButton ;
		if( item instanceof Ext.menu.Item ) {
			menuItem = item ;
			toolbarButton = item.up().ownerCmp ;
		} else if( item instanceof Ext.button.Button ) {
			menuItem = null ;
			toolbarButton = item ;
		} else {
			return ;
		}
		
		var me = this ;
		me.fireEvent('toolbaritemclick',toolbarButton.itemId,(menuItem ? menuItem.itemId : null),null) ;
	},
	onCheckItemChange: function( checkItem, checked ) {
		var menuItem = checkItem ;
		var toolbarButton = checkItem.up().ownerCmp ;
		
		var me = this ;
		me.fireEvent('toolbaritemclick',toolbarButton.itemId,menuItem.itemId,checked) ;
	}
	
});