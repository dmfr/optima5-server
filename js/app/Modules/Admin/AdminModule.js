Ext.define('AdminModuleItem',{
	extend: 'Ext.data.Model',
	idProperty: 'id',
	fields: [
		{name: 'id',  type:'string'},
		{name: 'title',  type:'string'},
		{name: 'caption',    type:'string'},
		{name: 'iconClsSmall',type:'string'},
		{name: 'iconClsBig',type:'string'},
		{name: 'jsClass', type:'string'}
	]
});

Ext.define('Optima5.Modules.Admin.AdminModule', {
	extend: 'Optima5.Module',
	
	requires: [
		'Optima5.ThumbListModel',
		'Optima5.Modules.Admin.AuthPanel',
		'Optima5.Modules.Admin.SdomainsPanel'
	],
	
	menuData: [{
		id:'auth-manager',
		title:'Users / Groups',
		caption:'Manage users, assign permission group(s) per sdomain',
		iconClsBig:'op5-admin-menu-users',
		iconClsSmall:'op5-admin-menu-users-icon',
		jsClass:'Optima5.Modules.Admin.AuthPanel'
	},{
		id:'sdomain-manager',
		title:'SDomains',
		caption:'Manage CRM sdomains, Db definition + import/export',
		iconClsBig:'op5-admin-menu-sdomains',
		iconClsSmall:'op5-admin-menu-sdomains-icon',
		jsClass:'Optima5.Modules.Admin.SdomainsPanel'
	}],
	
	initModule: function() {
		var me = this ;
		
		me.menuStore = Ext.create('Ext.data.Store',{
			model:'AdminModuleItem',
			data:me.menuData
		}) ;
		
		var thumbListData = [] ;
		me.menuStore.each( function(record) {
			if( !Ext.ClassManager.isCreated( record.get('jsClass') ) ) {
				Ext.require(record.get('jsClass'),null,me) ;
			}
			
			thumbListData.push({
				id:record.getId(),
				title:record.get('title'),
				caption:record.get('caption'),
				iconCls:record.get('iconClsBig')
			}) ;
		},me) ;
		
		var win = me.createWindow({
			width:640,
			height:480,
			resizable:true,
			maximizable:false,
			items:[{
				xtype: 'tabpanel',
				activeTab:0,
				layout:'border',
				items :[{
					xtype:'dataview',
					title: 'Admin',
					itemId: 'menu',
					tpl:[
						'<tpl for=".">',
						'<div id="{id}" class="thumb-wrap {iconCls}">',
						'<span class="title">{title}</span><br/>',
						'<span class="caption">{caption}</span>',
						'</div>',
						'</tpl><br/>'
					],
					itemSelector: 'div.thumb-wrap',
					store: {
						model:'Optima5.ThumbListModel',
						data:thumbListData
					},
					emptyText: 'No images available',
					overItemCls: 'x-view-over',
					singleSelect: true,
					listeners:{
						itemclick: function( view, record ) {
							me.openTab( record.getId() ) ;
						},
						scope:me
					}
				}]
			}]
		}) ;
		me.tabpanel = win.child('tabpanel') ;
	},
	getTabPanel: function() {
		var me = this ;
		return me.tabpanel ;
	},
	
	openTab: function( tabId ) {
		var me = this ,
			tab = me.getTabPanel().child('#'+tabId) ;
		
		if( tab == null ) {
			tab = me.createTab(tabId) ;
			if( tab==null ) {
				return ;
			}
		}
		tab.show() ;
	},
	createTab: function( tabId ) {
		var tab,
			me = this ,
			record = me.menuStore.getById(tabId) ;
		
		if( record == null ) {
			return null ;
		}
		if( !Ext.ClassManager.isCreated( record.get('jsClass') ) ) {
			console.log( record.get('jsClass') + ' not defined!' ) ;
			return null ;
		}
		tab = Ext.create(record.get('jsClass'),{
			optimaModule: me,
			itemId: tabId,
			title: record.get('title'),
			iconCls: record.get('iconClsSmall'),
			closable:true
		}) ;
		me.getTabPanel().add(tab) ;
		return tab ;
	},
	
	postCrmEvent: function( crmEvent, postParams ) {
		var me = this ;
		if( typeof postParams === 'undefined' ) {
			postParams = {} ;
		}
		
		var eventParams = {} ;
		switch( crmEvent ) {
			case 'sdomainchange' :
				Ext.apply( eventParams, {
					sdomainId: postParams.sdomainId
				}) ;
				break ;
				
			case 'authchange' :
				Ext.apply( eventParams, {
					userId: postParams.userId,
					groupId: postParams.groupId
				}) ;
				break ;
				
			default :
				return ;
		}
		me.fireEvent('op5broadcast',crmEvent,eventParams) ;
	}
});