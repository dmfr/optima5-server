Ext.define('Optima5.Modules.CrmBase.QwindowToolbar',{
	extend: 'Ext.toolbar.Toolbar',
	
	clsForPublished: 'op5-crmbase-published',
	clsForAutorun:   'op5-crmbase-autorun',
	clsForToken:     'op5-crmbase-token',
	
	initComponent: function() {
		var me = this ;
		Ext.apply( this , {
			defaults: {
				hidden:true
			},
			items : [{
				itemId: 'file',
				text: 'File',
				hidden:false,
				iconCls: 'op5-crmbase-qtoolbar-file',
				viewConfig: {forceFit: true},
				menu: {
					defaults: {
						handler:me.onItemClick,
						scope:me
					},
					items: [{
						itemId: 'save',
						text: 'Save',
						iconCls: 'op5-crmbase-qtoolbar-file-save'
					},{
						itemId: 'saveas',
						text: 'Save as',
						iconCls: 'op5-crmbase-qtoolbar-file-saveas',
						handler: null,
						menu: {
							items:[{
								xtype:'textfield' ,
								width:150
							},{
								xtype:'button',
								text:'Save Query',
								handler: function(button){
									var textfield = button.up('menu').query('textfield')[0] ;
									me.onItemMenuSubmit( button.up('menu').ownerCmp,textfield.getValue() ) ;
									Ext.menu.Manager.hideAll();
								},
								scope:me
							}]
						},
						scope: me
					},{
						itemId: 'delete',
						text: 'Delete',
						iconCls: 'op5-crmbase-qtoolbar-file-delete'
					}]
				}
			},{
				itemId: 'run',
				text: 'Run Query',
				iconCls: 'op5-crmbase-qtoolbar-run',
				handler: me.onButtonClick,
				scope: me
			},{
				itemId: 'run-qbook',
				text: 'Run Qbook',
				iconCls: 'op5-crmbase-qtoolbar-run',
				menu: []
			},{
				itemId: 'ztemplates',
				text: 'Ztemplates',
				iconCls: 'op5-crmbase-qtoolbar-ztemplates',
				menu: [],
				handler:me.onButtonClick,
				scope: me
			},{
				itemId: 'options',
				text: 'Options',
				iconCls: 'op5-crmbase-qtoolbar-options',
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
						itemId: 'setup-token',
						textTpl: 'Token publish',
						scope: me
					},{
						itemId: 'setup-autorun',
						textTpl: '<font color="red">Autorun</font>',
						scope: me
					}]
				}
			}]
		});
		me.callParent() ;
	},
	
	onButtonClick: function( button ) {
		var me = this ;
		me.fireEvent('toolbaritemclick',button.itemId,null,null) ;
	},
	onItemClick:function( item ) {
		var menuItem = item ;
		var toolbarButton = item.up().ownerCmp ;
		
		var me = this ;
		me.fireEvent('toolbaritemclick',toolbarButton.itemId,menuItem.itemId,null) ;
	},
	onCheckItemChange: function( checkItem, checked ) {
		var menuItem = checkItem ;
		var toolbarButton = checkItem.up().ownerCmp ;
		
		var me = this ;
		me.fireEvent('toolbaritemclick',toolbarButton.itemId,menuItem.itemId,checked) ;
	},
	onItemMenuSubmit:function( item, input ) {
		var menuItem = item ;
		var toolbarButton = item.up().ownerCmp ;
		
		var me = this ;
		me.fireEvent('toolbaritemclick',toolbarButton.itemId,menuItem.itemId,input) ;
	}
});
