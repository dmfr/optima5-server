Ext.define('AuthUserGroupLinkModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'link_group_id', type:'int'}
	]
});
Ext.define('AuthUserModel',{
	extend: 'Ext.data.Model' ,
	idProperty: 'user_id',
	fields: [
		{name: 'user_id', type:'string'},
		{name: 'user_fullname', type:'string'},
		{name: 'user_email', type:'string'},
		{name: 'auth_is_admin', type:'boolean'},
		{name: 'auth_is_disabled', type:'boolean'}
	],
	hasMany: [{
		model: 'AuthUserGroupLinkModel',
		name: 'link_groups',
		associationKey: 'link_groups'
	}]
});
Ext.define('AuthGroupActionModel',{
	extend: 'Ext.data.Model',
	fields: [
		{name: 'action_code', type:'string'},
		{name: 'action_param_is_wildcard', type:'boolean'},
		{name: 'action_param_data', type:'string'},
		{name: 'auth_has_read', type:'string'},
		{name: 'auth_has_write', type:'string'}
	]
});
Ext.define('AuthGroupModel',{
	extend: 'Ext.data.Model',
	idProperty: 'group_id',
	fields: [
		{name: 'group_id', type:'int'},
		{name: 'sdomain_id', type:'string'},
		{name: 'group_name', type:'string'},
		{name: 'auth_has_all', type:'boolean'}
	],
	hasMany: [{
		model: 'AuthGroupActionModel',
		name: 'actions',
		associationKey: 'actions'
	}]
});

Ext.define('AuthTreeUsersModel', {
	extend: 'Ext.data.Model',
	idProperty:'id',
	fields: [
		{name: 'id', type:'string'}, // dummy ID as tree is built for display purposes only
		{name: 'text', type:'string'},
		{name: 'user_id',  type: 'string'},
		{name: 'user_fullname', type:'string'},
		{name: 'sdomain_id',  type: 'string'},
		{name: 'sdomain_name',  type: 'string'},
		{name: 'group_id',  type: 'int'},
		{name: 'group_name', type:'string'}
	]
});

Ext.define('AuthTreeGroupsModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'id',  type: 'int'}, // dummy ID as tree is built for display purposes only
		{name: 'text', type:'string'},
		{name: 'sdomain_id',  type: 'string'},
		{name: 'sdomain_name',  type: 'string'},
		{name: 'group_id',  type: 'int'},
		{name: 'group_name', type:'string'},
		{name: 'user_id',  type: 'string'},
		{name: 'user_fullname', type:'string'}
	]
});

Ext.define('Optima5.Modules.Admin.AuthPanel',{
	extend:'Ext.panel.Panel',
	
	stores: {
		sdomainsStore: null,
		usersStore: null,
		groupsStore: null
	},
	storesLoading: 0,
	
	initComponent: function() {
		var me = this ;
		
		Ext.apply(me,{
			layout: 'border',
			items:[{
				xtype: 'panel',
				itemId: 'mAuthList',
				region: 'center',
				border:false,
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				tbar:[{
					itemId:'tbUserBtn',
					iconCls:'op5-auth-menu-new',
					text:'Create User'
				},'->',{
					itemId:'tbGroupBtn',
					iconCls:'op5-auth-menu-new',
					text:'Define Group on Sdomain',
					menu:[]
				}],
				items:[{
					xtype:'treepanel',
					itemId:'pTreeUsers',
					flex:1,
					rootVisible: false,
					useArrows: true,
					title:'Users',
					iconCls:'op5-auth-panel-users',
					store:{
						model:'AuthTreeUsersModel',
						root:{
							children:[]
						}
					},
					listeners: {
						scrollershow: function(scroller) {
							if (scroller && scroller.scrollEl) {
								scroller.clearManagedListeners(); 
								scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
							}
						}
					}
				},{
					xtype:'treepanel',
					itemId:'pTreeGroups',
					flex:1,
					rootVisible: false,
					useArrows: true,
					title:'Groups',
					iconCls:'op5-auth-panel-groups',
					store:{
						model:'AuthTreeGroupsModel',
						root:{
							children:[]
						}
					},
					listeners: {
						scrollershow: function(scroller) {
							if (scroller && scroller.scrollEl) {
								scroller.clearManagedListeners(); 
								scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
							}
						}
					}
				}]
			},{
				region:'east',
				xtype: 'panel',
				layout:'fit',
				width: 400,
				itemId:'mGroupFormContainer',
				title: '',
				collapsible:true,
				collapsed: true,
				empty:false,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel.empty || !(me.getComponent('mUserFormContainer').getState().collapsed) ) {
							return false;
						}
					},
					expand:function(){
						me.getComponent('mAuthList').getComponent('pTreeUsers').hide() ;
						me.getComponent('mAuthList').child('toolbar').getComponent('tbUserBtn').hide() ;
					},
					collapse: function() {
						me.getComponent('mAuthList').getComponent('pTreeUsers').show() ;
						me.getComponent('mAuthList').child('toolbar').getComponent('tbUserBtn').show() ;
					},
					scope:me
				}
			},{
				region:'west',
				xtype: 'panel',
				layout:'fit',
				width: 400,
				itemId:'mUserFormContainer',
				title: '',
				collapsible:true,
				collapsed: true,
				empty:false,
				listeners:{
					beforeexpand:function(westpanel) {
						if( westpanel.empty || !(me.getComponent('mGroupFormContainer').getState().collapsed) ) {
							return false;
						}
					},
					expand:function(){
						me.getComponent('mAuthList').getComponent('pTreeGroups').hide() ;
						me.getComponent('mAuthList').child('toolbar').getComponent('tbGroupBtn').hide() ;
					},
					collapse: function() {
						me.getComponent('mAuthList').getComponent('pTreeGroups').show() ;
						me.getComponent('mAuthList').child('toolbar').getComponent('tbGroupBtn').show() ;
					},
					scope:me
				}
			}]
		}) ;
		
		
		me.stores.sdomainsStore = Ext.create('Ext.data.Store',{
			model: 'AdminSdomainModel',
			proxy: me.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'sdomains_getList'
				},
				reader: {
					type: 'json',
					root: 'data'
				}
			}),
			autoLoad: false
		}) ;
		
		me.stores.usersStore = Ext.create('Ext.data.Store',{
			model: 'AuthUserModel',
			proxy: me.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'auth_users_getList'
				},
				reader: {
					type: 'json',
					root: 'data'
				}
			}),
			autoLoad: false
		}) ;
		
		me.stores.groupsStore = Ext.create('Ext.data.Store',{
			model: 'AuthGroupModel',
			proxy: me.optimaModule.getConfiguredAjaxProxy({
				extraParams : {
					_action: 'auth_groups_getList'
				},
				reader: {
					type: 'json',
					root: 'data'
				}
			}),
			autoLoad: false
		}) ;
		
		
		me.callParent() ;
		me.load() ;
	},
	load: function() {
		var me = this ;
		Ext.Object.each( me.stores, function(key,store) {
			store.on('load',me.onStoreLoaded,me,{single:true}) ;
		},me) ;
		me.storesLoading = Ext.Object.getSize(me.stores) ;
		Ext.Object.each( me.stores, function(key,store) {
			store.load() ;
		},me) ;
	},
	onStoreLoaded: function(store) {
		var me = this ;
		me.storesLoading-- ;
		
		if( store == me.stores.sdomainsStore ) {
			// console.log('building menu') ;
			
			var menuCfg = [],
				iconsLib = Optima5.Helper.getIconsLib() ;
			me.stores.sdomainsStore.each(function(sdomain) {
				menuCfg.push({
					text: sdomain.get('sdomain_name'),
					iconCls: iconsLib.iconGetCls16(sdomain.get('icon_code'))
				}) ;
			},me);
			
			var sdomainsMenu = me.getComponent('mAuthList').child('toolbar').getComponent('tbGroupBtn').menu ;
			sdomainsMenu.removeAll() ;
			sdomainsMenu.add(menuCfg) ;
		}
		if( me.storesLoading > 0 ) {
			return ;
		}
		
		// dernier appel (storesLoading=0) => affichage des trees
		me.buildTrees() ;
	},
	buildTrees: function() {
		var me = this,
			iconsLib = Optima5.Helper.getIconsLib() ;
		
		// console.log('building trees : users') ;
		var childrenUsers = [] ;
		me.stores.usersStore.each( function(userRecord) {
			var userId = userRecord.get('user_id'),
				userName = userRecord.get('user_fullname'),
				userIsAdmin = userRecord.get('auth_is_admin'),
				oSdomainGroups = {} ;
			userRecord.link_groups().each( function(linkgroupRecord) {
				var groupRecord = me.stores.groupsStore.getById( linkgroupRecord.get('link_group_id') ) ,
					groupId = groupRecord.get('group_id'),
					sdomainId = groupRecord.get('sdomain_id'),
					groupName = groupRecord.get('group_name'),
					groupHasAll = groupRecord.get('auth_has_all');
				
				if( typeof oSdomainGroups[sdomainId] == 'undefined' ) {
					oSdomainGroups[sdomainId] = [] ;
				}
				oSdomainGroups[sdomainId].push({
					group_id: groupId,
					group_name: groupName,
					auth_has_all: groupHasAll
				});
			},me );
			
			var childrenUserSdomains = [] ;
			Ext.Object.each( oSdomainGroups, function(sdomainId,arrGroups) {
				var childrenUserSdomainGroups = [] ;
				Ext.Array.each( arrGroups, function( groupObj ) {
					childrenUserSdomainGroups.push({
						iconCls: groupObj.auth_has_all ? 'op5-auth-panel-group-admin' : 'op5-auth-panel-group' ,
						text: groupObj.group_name,
						leaf: true,
						group_id: groupObj.group_id,
						group_name: groupObj.group_name
					}) ;
				},me);
				
				var sdomainRecord = me.stores.sdomainsStore.getById(sdomainId) ;
				if( sdomainRecord == null ) {
					return true ;
				}
				
				childrenUserSdomains.push({
					iconCls: iconsLib.iconGetCls16(sdomainRecord.get('icon_code')),
					text: sdomainRecord.get('sdomain_name'),
					children: childrenUserSdomainGroups,
					sdomain_id: sdomainId,
					sdomain_name: sdomainRecord.get('sdomain_name'),
					expanded: false
				});
			},me) ;
			
			var userText = '' ;
			userText += '<span class="op5-auth-treetext-userid">' ;
			userText += userId ;
			userText += '</span>' ;
			userText += '<span class="op5-auth-treetext-username">' ;
			userText += userName ;
			userText += '</span>' ;
			
			childrenUsers.push({
				iconCls: userIsAdmin ? 'op5-auth-panel-user-admin' : 'op5-auth-panel-user' ,
				text: userText,
				children: childrenUserSdomains,
				user_id: userId,
				user_name: userName,
				expanded: false
			}) ;
		},me) ;
		
		me.getComponent('mAuthList').getComponent('pTreeUsers').getStore().setRootNode({
			root:true,
			children:childrenUsers,
			expanded:true
		});
		
		
		
		
		// console.log('building trees : groups') ;
		var oSdomainGroups = {} ;
		me.stores.groupsStore.each( function(groupRecord) {
			var groupId = groupRecord.get('group_id'),
				sdomainId = groupRecord.get('sdomain_id'),
				groupName = groupRecord.get('group_name'),
				groupHasAll = groupRecord.get('auth_has_all');
				
			if( typeof oSdomainGroups[sdomainId] == 'undefined' ) {
				oSdomainGroups[sdomainId] = [] ;
			}
			oSdomainGroups[sdomainId].push({
				group_id: groupId,
				group_name: groupName,
				auth_has_all: groupHasAll
			});
		},me) ;
		
		var childrenSdomains = [] ;
		me.stores.sdomainsStore.each( function(sdomainRecord) {
			var sdomainId = sdomainRecord.getId() ;
			
			var childrenSdomainGroups = [] ;
			if( typeof oSdomainGroups[sdomainId] !== 'undefined' ) {
				Ext.Array.each( oSdomainGroups[sdomainId], function( groupObj ) {
					childrenSdomainGroups.push({
						iconCls: groupObj.auth_has_all ? 'op5-auth-panel-group-admin' : 'op5-auth-panel-group' ,
						text: groupObj.group_name,
						leaf: true,
						group_id: groupObj.group_id,
						group_name: groupObj.group_name
					}) ;
				},me);
			}
			childrenSdomains.push({
				iconCls: iconsLib.iconGetCls16(sdomainRecord.get('icon_code')),
				text: sdomainRecord.get('sdomain_name'),
				children: childrenSdomainGroups,
				sdomain_id: sdomainId,
				sdomain_name: sdomainRecord.get('sdomain_name'),
				expanded: false
			});
		},me) ;
		
		me.getComponent('mAuthList').getComponent('pTreeGroups').getStore().setRootNode({
			root:true,
			children:childrenSdomains,
			expanded:true
		});
	}
});