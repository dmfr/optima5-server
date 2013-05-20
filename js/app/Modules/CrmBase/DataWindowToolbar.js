Ext.define('Optima5.Modules.CrmBase.DataWindowToolbar' ,{
	extend: 'Ext.toolbar.Toolbar',
	requires: [
		'Optima5.Modules.CrmBase.DefineStorePanel'
	],
	
	clsForPublished: 'op5-crmbase-published',
	
	initComponent: function() {
		var me = this ;
		Ext.apply( this , {
			items : [{
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
						itemId: 'export-excel',
						text: 'Excel export',
						iconCls: 'op5-crmbase-datatoolbar-file-export-excel',
					},{
						itemId: 'export-gallery',
						text: 'DL gallery as zip',
						iconCls: 'op5-crmbase-datatoolbar-file-export-gallery',
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
						itemId: 'grid',
						text: 'Grid data',
						iconCls: 'op5-crmbase-datatoolbar-view-grid',
					},{
						itemId: 'gmap',
						text: 'GMap/locations',
						iconCls: 'op5-crmbase-datatoolbar-view-gmap',
					},{
						itemId: 'gallery',
						text: 'Img Gallery',
						iconCls: 'op5-crmbase-datatoolbar-view-gallery',
					}]
				}
			},{
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
						iconCls: 'op5-crmbase-datatoolbar-options-definestore',
					}]
				}
			}]
		});
		// console.dir(this.bibleMenu.items) ;
		this.addEvents();
		this.callParent() ;
	},
	
	reconfigure: function( ajaxData ) {
		var me = this ;
		
		// menu File
		var fileMenu = me.child('#file') ;
		fileMenu.menu.hide() ;
		if( typeof ajaxData.fileId !== 'undefined' ) {
			fileMenu.setVisible(true) ;
			fileMenu.menu.child('#export-excel').setVisible(true) ;
			fileMenu.menu.child('#export-gallery').setVisible( ajaxData.viewmode_gallery ) ;
		} else {
			fileMenu.setVisible(false) ;
		}
		
		var viewMenu = me.child('#view') ;
		viewMenu.menu.hide() ;
		viewMenu.setVisible(true) ;
		viewMenu.menu.child('#grid').setVisible( ajaxData.viewmode_grid ) ;
		viewMenu.menu.child('#gmap').setVisible( ajaxData.viewmode_gmap ) ;
		viewMenu.menu.child('#gallery').setVisible( ajaxData.viewmode_gallery ) ;
		
		var optionsMenu = me.child('#options') ;
		optionsMenu.menu.hide() ;
		optionsMenu.setVisible(true) ;
		optionsMenu.menu.child('#toggle-android').setChecked( ajaxData.isPublished, true ) ;
		if( ajaxData.isPublished ) {
			optionsMenu.menu.child('#toggle-android').addCls( me.clsForPublished ) ;
		} else {
			optionsMenu.menu.child('#toggle-android').removeCls( me.clsForPublished ) ;
		}
	},
	
	onItemClick:function( item ) {
		var menuItem = item ;
		var toolbarButton = item.up().floatParent ;
		
		var me = this ;
		me.fireEvent('toolbaritemclick',toolbarButton.itemId,menuItem.itemId,null) ;
	},
	onCheckItemChange: function( checkItem, checked ) {
		var menuItem = checkItem ;
		var toolbarButton = checkItem.up().floatParent ;
		
		var me = this ;
		me.fireEvent('toolbaritemclick',toolbarButton.itemId,menuItem.itemId,checked) ;
	}
	
});