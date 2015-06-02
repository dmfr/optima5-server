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
		{name: 'auth_has_read', type:'boolean'},
		{name: 'auth_has_write', type:'boolean'}
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
		{name: '_type', type:'string'},
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
		{name: '_type', type:'string'},
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
	
	requires:[
		'Optima5.Modules.Admin.AuthGroupForm',
		'Optima5.Modules.Admin.AuthUserForm'
	],
	
	stores: {
		sdomainsStore: null,
		usersStore: null,
		groupsStore: null
	},
	storesLoading: 0,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsPanel','No module reference ?') ;
		}
		
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
					text:'Create User',
					handler : function() {
						me.editUser( null ) ;
					},
					scope : me
				},{
					itemId:'tbSavePermBtn',
					iconCls:'op5-auth-menu-save',
					text:'Save permissions',
					hidden:true,
					handler:function() {
						me.ugSubmit() ;
					},
					scope:me
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
						itemclick: function(view, record, item, index, event) {
							var treeContextMenuItems = new Array() ;
							switch( record.get('_type') ) {
								case 'user' :
									record.expand() ;
									treeContextMenuItems.push({
										iconCls: 'op5-auth-panel-user',
										text: 'Edit User',
										handler : function() {
											me.editUser( record.get('user_id') ) ;
										},
										scope : me
									});
									break ;
								case 'group' :
									treeContextMenuItems.push({
										iconCls: 'op5-auth-panel-unassociate',
										text: 'Unassociate group',
										handler : function() {
											// find parent
											var userRecord = record ;
											while( true ) {
												if( userRecord == null ) {
													return ;
												}
												if( userRecord.get('_type') == 'user' ) {
													break ;
												}
												userRecord = userRecord.parentNode ;
											}
											me.ugUnassociate( userRecord.get('user_id'), record.get('group_id') ) ;
										},
										scope : me
									});
									break ;
							}
							if( treeContextMenuItems.length == 0 ) {
								return ;
							}
							var treeContextMenu = Ext.create('Ext.menu.Menu',{
								items : treeContextMenuItems,
								listeners: {
									hide: function(menu) {
										Ext.defer(function(){menu.destroy();},10) ;
									}
								}
							}) ;
							treeContextMenu.showAt(event.getXY());
						},
						scope:me
					},
					viewConfig: {
						plugins: {
							ptype: 'treeviewdragdrop',
							dragGroup:'user2group',
							dropGroup:'group2user',
							appendOnly:true,
							allowParentInsert:false
						},
						listeners:{
							beforedrop:function(node, data, dropRecord, dropPosition, dropHandlers){
								var srcNodeGroup = data.records[0] ;
								var destNodeUser = dropRecord ;
								if( srcNodeGroup == null || destNodeUser == null ) {
									return false ;
								}
								if( srcNodeGroup.get('_type') == 'group' && destNodeUser.get('_type') == 'user' ) {
									dropHandlers.wait=true
									me.ugAssociate( destNodeUser.get('user_id'), srcNodeGroup.get('group_id') ) ;
									return true ;
								}
								return false ;
							},
							scope:me
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
						itemclick: function(view, record, item, index, event) {
							var treeContextMenuItems = new Array() ;
							switch( record.get('_type') ) {
								case 'group' :
									record.expand() ;
									treeContextMenuItems.push({
										iconCls: 'op5-auth-panel-group',
										text: 'Edit Group',
										handler : function() {
											me.editGroup( record.get('group_id') ) ;
										},
										scope : me
									});
									break ;
								case 'user' :
									treeContextMenuItems.push({
										iconCls: 'op5-auth-panel-unassociate',
										text: 'Unassociate user',
										handler : function() {
											// find parent
											var groupRecord = record ;
											while( true ) {
												if( groupRecord == null ) {
													return ;
												}
												if( groupRecord.get('_type') == 'group' ) {
													break ;
												}
												groupRecord = groupRecord.parentNode ;
											}
											me.ugUnassociate( record.get('user_id'), groupRecord.get('group_id') ) ;
										},
										scope : me
									});
									break ;
							}
							if( treeContextMenuItems.length == 0 ) {
								return ;
							}
							var treeContextMenu = Ext.create('Ext.menu.Menu',{
								items : treeContextMenuItems,
								listeners: {
									hide: function(menu) {
										Ext.defer(function(){menu.destroy();},10) ;
									}
								}
							}) ;
							treeContextMenu.showAt(event.getXY());
						},
						scope:me
					},
					viewConfig: {
						plugins: {
							ptype: 'treeviewdragdrop',
							dragGroup:'group2user',
							dropGroup:'user2group',
							appendOnly:true,
							allowParentInsert:false
						},
						listeners:{
							beforedrop:function(node, data, dropRecord, dropPosition, dropHandlers){
								var srcNodeUser = data.records[0] ;
								var destNodeGroup = dropRecord ;
								if( srcNodeUser == null || destNodeGroup == null ) {
									return false ;
								}
								if( srcNodeUser.get('_type') == 'user' && destNodeGroup.get('_type') == 'group' ) {
									dropHandlers.wait=true
									me.ugAssociate( srcNodeUser.get('user_id'), destNodeGroup.get('group_id') ) ;
									return true ;
								}
								return false ;
							},
							scope:me
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
				empty:true,
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
				width: 350,
				itemId:'mUserFormContainer',
				title: '',
				collapsible:true,
				collapsed: true,
				empty:true,
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
					rootProperty: 'data'
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
					rootProperty: 'data'
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
					rootProperty: 'data'
				}
			}),
			autoLoad: false
		}) ;
		
		
		me.callParent() ;
		me.mon(me.optimaModule,'op5broadcast',me.onCrmeventBroadcast,me) ;
		me.load() ;
	},
	onCrmeventBroadcast: function( crmEvent, eventParams ) {
		var me = this ;
		switch( crmEvent ) {
			case 'authchange' :
				return me.endFormpanelAction() ;
		}
	},
	load: function() {
		var me = this ;
		me.getComponent('mAuthList').child('toolbar').getComponent('tbSavePermBtn').hide() ;
		
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
					iconCls: iconsLib.iconGetCls16(sdomain.get('icon_code')),
					handler: function() {
						me.editGroup(null,sdomain.getId()) ;
					}
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
				userIsDisabled = userRecord.get('auth_is_disabled'),
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
						_type:'group',
						leaf: true,
						group_id: groupObj.group_id,
						group_name: groupObj.group_name,
						allowDrag:false,
						allowDrop:false
					}) ;
				},me);
				
				var sdomainRecord = me.stores.sdomainsStore.getById(sdomainId) ;
				if( sdomainRecord == null ) {
					return true ;
				}
				
				childrenUserSdomains.push({
					iconCls: iconsLib.iconGetCls16(sdomainRecord.get('icon_code')),
					text: sdomainRecord.get('sdomain_name'),
					_type:'sdomain',
					children: childrenUserSdomainGroups,
					sdomain_id: sdomainId,
					sdomain_name: sdomainRecord.get('sdomain_name'),
					expandable: true,
					expanded:true,
					allowDrag:false,
					allowDrop:false
				});
			},me) ;
			
			var userText = '' ;
			if( userIsDisabled ) {
				userText += '<span class="op5-auth-treetext-userid op5-auth-treetext-disabled">' ;
			} else {
				userText += '<span class="op5-auth-treetext-userid">' ;
			}
			userText += userId ;
			userText += '</span>' ;
			if( userIsDisabled ) {
				userText += '<span class="op5-auth-treetext-username op5-auth-treetext-disabled">' ;
			} else {
				userText += '<span class="op5-auth-treetext-username">' ;
			}
			userText += userName ;
			userText += '</span>' ;
			
			childrenUsers.push({
				iconCls: (userIsDisabled ? 'op5-auth-panel-user-disabled' : (userIsAdmin ? 'op5-auth-panel-user-admin' : 'op5-auth-panel-user')) ,
				text: userText,
				_type:'user',
				children: childrenUserSdomains,
				user_id: userId,
				user_name: userName,
				expanded: false,
				allowDrag: userIsAdmin ? false : true,
				allowDrop: userIsAdmin ? false : true
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
		
		var oGroupUsers = {} ;
		me.stores.usersStore.each( function(userRecord) {
			userRecord.link_groups().each( function(userLinkGroupRecord) {
				var userId = userRecord.getId() ;
				var groupId = userLinkGroupRecord.get('link_group_id') ;
				
				if( typeof oGroupUsers[groupId] == 'undefined' ) {
					oGroupUsers[groupId] = [] ;
				}
				oGroupUsers[groupId].push({
					user_id:userRecord.getId(),
					user_name:userRecord.get('user_fullname')
				});
			},me) ;
		},me) ;
		
		var childrenSdomains = [] ;
		me.stores.sdomainsStore.each( function(sdomainRecord) {
			var sdomainId = sdomainRecord.getId() ;
			
			var childrenSdomainGroups = [] ;
			if( typeof oSdomainGroups[sdomainId] !== 'undefined' ) {
				Ext.Array.each( oSdomainGroups[sdomainId], function( groupObj ) {
					var childrenSdomainGroupUsers = [],
						groupId = groupObj.group_id ;
					
					if( typeof oGroupUsers[groupId] !== 'undefined' ) {
						Ext.Array.each( oGroupUsers[groupId], function( userObj ) {
							var userText = '' ;
							userText += '<span class="op5-auth-treetext-userid">' ;
							userText += userObj.user_id ;
							userText += '</span>' ;
							userText += '<span class="op5-auth-treetext-username">' ;
							userText += userObj.user_name ;
							userText += '</span>' ;
							
							childrenSdomainGroupUsers.push({
								iconCls: 'op5-auth-panel-user' ,
								text: userText,
								_type:'user',
								leaf:true,
								user_id: userObj.user_id,
								user_name: userObj.user_name,
								allowDrop:false,
								allowDrag:false
							}) ;
						},me) ;
					}
					
					childrenSdomainGroups.push({
						iconCls: groupObj.auth_has_all ? 'op5-auth-panel-group-admin' : 'op5-auth-panel-group' ,
						text: groupObj.group_name,
						_type:'group',
						children:childrenSdomainGroupUsers,
						group_id: groupObj.group_id,
						group_name: groupObj.group_name,
						expanded: false,
						allowDrop:true,
						allowDrag:true
					}) ;
				},me);
			}
			childrenSdomains.push({
				iconCls: iconsLib.iconGetCls16(sdomainRecord.get('icon_code')),
				text: sdomainRecord.get('sdomain_name'),
				_type:'sdomain',
				children: childrenSdomainGroups,
				sdomain_id: sdomainId,
				sdomain_name: sdomainRecord.get('sdomain_name'),
				expanded: true,
				allowDrop:false,
				allowDrag:false
			});
		},me) ;
		
		me.getComponent('mAuthList').getComponent('pTreeGroups').getStore().setRootNode({
			root:true,
			children:childrenSdomains,
			expanded:true
		});
	},
	editUser: function( userId ) {
		//console.log('Editing user '+userId) ;
		var me = this,
			mformcontainer = me.getComponent('mUserFormContainer'),
			mform = mformcontainer.getComponent('mUserForm') ,
			record = me.stores.usersStore.getById(userId) ;
			
		if( me.optimaModule.getApp().desktopGetCfgRecord().get('login_userId') == userId ) {
			Ext.Msg.alert('Stop', 'Can\'t edit own user record ['+userId+']');
			return ;
		}
		
		if( mform != null ) {
			if( record != null ) {
				if( record.getId() == mform.sdomainId ) {
					mformcontainer.expand(false) ;
					return ;
				}
			} else {
				if( mform.isNew ) {
					mformcontainer.expand(false) ;
					return ;
				}
			}
		}
		
		mform = Ext.create('Optima5.Modules.Admin.AuthUserForm',{
			border:false,
			itemId:'mUserForm',
			optimaModule: me.optimaModule
		}) ;
		mform.loadRecord(record) ;
		var strTitle = ( record == null ? 'New user account' : record.get('user_id')+' : '+record.get('user_fullname') ) ;
		mformcontainer.setTitle( strTitle ) ;
		mformcontainer.empty = false ;
		mformcontainer.removeAll() ;
		mformcontainer.add(mform) ;
		mformcontainer.expand(false) ;
	},
	editGroup: function( groupId, newSdomainId ) {
		//console.log('Editing group '+groupId) ;
		var me = this,
			mformcontainer = me.getComponent('mGroupFormContainer'),
			mform = mformcontainer.getComponent('mGroupForm') ,
			record = me.stores.groupsStore.getById(groupId) ;
		
		if( record==null && newSdomainId==null ) {
			return ;
		}
		
		if( mform != null ) {
			if( record != null ) {
				if( record.getId() == mform.groupId ) {
					mformcontainer.expand(false) ;
					return ;
				}
			} else {
				if( mform.isNew && mform.sdomainId == newSdomainId ) {
					mformcontainer.expand(false) ;
					return ;
				}
			}
		}
		
		mform = Ext.create('Optima5.Modules.Admin.AuthGroupForm',{
			border:false,
			itemId:'mGroupForm',
			optimaModule: me.optimaModule
		}) ;
		mform.loadRecord(record,newSdomainId) ;
		var strTitle = ( record == null ? 'New group' : record.get('group_name') ) ;
		mformcontainer.setTitle( strTitle ) ;
		mformcontainer.empty = false ;
		mformcontainer.removeAll() ;
		mformcontainer.add(mform) ;
		mformcontainer.expand(false) ;
	},
	
	
	ugAssociate: function( userId, groupId ) {
		//console.log('Associating user '+userId+' with group '+groupId) ;
		
		var me = this ;
		
		/*
		 * me.stores.usersStore :
		 * - recherche user
		 * - ajout link_groups() si non existant
		 */
		var userRecord = me.stores.usersStore.getById( userId ) ,
			groupRecord = me.stores.groupsStore.getById( groupId ) ,
			sdomainRecord = ( groupRecord != null ) ? me.stores.sdomainsStore.getById( groupRecord.get('sdomain_id') ) : null ;
		if( userRecord == null || groupRecord == null || sdomainRecord == null ) {
			return ;
		}
		if( userRecord.link_groups().findRecord('link_group_id',groupId) ) {
			//console.log('Perm already set !') ;
			return ;
		}
		userRecord.link_groups().add( Ext.create('AuthUserGroupLinkModel',{link_group_id:groupId}) ) ;
		
		me.ugShowSave() ;
		
		
		/*
		 * treeUsers :
		 * develop du user
		 * ajout du sdomain si non existant + develop du sdomain
		 * ajout du group
		 */
		var treeUsersRoot = me.getComponent('mAuthList').getComponent('pTreeUsers').getRootNode() ,
				userNode = treeUsersRoot.findChild('user_id',userId) ;
		if( userNode != null ) {
			userNode.expand(true) ;
			var sdomainNode = userNode.findChild('sdomain_id',groupRecord.get('sdomain_id')) ;
			if( sdomainNode == null ) {
				sdomainNode = userNode.appendChild({
					iconCls: Optima5.Helper.getIconsLib().iconGetCls16(sdomainRecord.get('icon_code')),
					text: sdomainRecord.get('sdomain_name'),
					_type:'sdomain',
					children: [],
					sdomain_id: sdomainRecord.getId(),
					sdomain_name: sdomainRecord.get('sdomain_name'),
					expandable: true,
					expanded:true,
					allowDrag:false,
					allowDrop:false
				}) ;
			}
			sdomainNode.appendChild({
				iconCls: groupRecord.get('auth_has_all') ? 'op5-auth-panel-group-admin' : 'op5-auth-panel-group' ,
				text: groupRecord.get('group_name'),
				_type:'group',
				leaf: true,
				group_id: groupRecord.get('group_id'),
				group_name: groupRecord.get('group_name'),
				allowDrag:false,
				allowDrop:false
			});
		}
		
		
		/*
		 * treeGroups :
		 * - develop du group
		 * - ajout du user
		 */
		var treeGroupsRoot = me.getComponent('mAuthList').getComponent('pTreeGroups').getRootNode() ,
				sdomainNode = treeGroupsRoot.findChild('sdomain_id',groupRecord.get('sdomain_id')) ,
				groupNode = (sdomainNode != null) ? sdomainNode.findChild('group_id',groupId) : null ;
		if( groupNode != null ) {
			groupNode.expand() ;
			
			var userText = '' ;
			userText += '<span class="op5-auth-treetext-userid">' ;
			userText += userRecord.get('user_id') ;
			userText += '</span>' ;
			userText += '<span class="op5-auth-treetext-username">' ;
			userText += userRecord.get('user_fullname') ;
			userText += '</span>' ;
			groupNode.appendChild({
				iconCls: 'op5-auth-panel-user' ,
				text: userText,
				_type:'user',
				leaf:true,
				user_id: userRecord.get('user_id'),
				user_name: userRecord.get('user_fullname'),
				allowDrop:false,
				allowDrag:false
			});
		}
		
	},
	ugUnassociate: function( userId, groupId ) {
		//console.log('Unassociating user '+userId+' with group '+groupId) ;
		
		var me = this ;
		
		var userRecord = me.stores.usersStore.getById( userId ) ,
			groupRecord = me.stores.groupsStore.getById( groupId ) ,
			sdomainRecord = ( groupRecord != null ) ? me.stores.sdomainsStore.getById( groupRecord.get('sdomain_id') ) : null ;
		if( userRecord == null || groupRecord == null || sdomainRecord == null ) {
			return ;
		}
		var userLinkGroupRecord = userRecord.link_groups().findRecord('link_group_id',groupId) ;
		if( userLinkGroupRecord == null ) {
			//console.log('Perm not set !') ;
			return ;
		}
		userRecord.link_groups().remove( userLinkGroupRecord ) ;
		
		me.ugShowSave() ;
		
		
		var treeUsersRoot = me.getComponent('mAuthList').getComponent('pTreeUsers').getRootNode() ,
				userNode = treeUsersRoot.findChild('user_id',userId) ,
				sdomainNode = (userNode != null) ? userNode.findChild('sdomain_id',groupRecord.get('sdomain_id')) : null ,
				groupNode = (sdomainNode != null) ? sdomainNode.findChild('group_id',groupId) : null ;
		if( groupNode != null ) {
			groupNode.remove() ;
			if( !sdomainNode.hasChildNodes() ) {
				sdomainNode.remove();
			}
		}
		
		var treeGroupsRoot = me.getComponent('mAuthList').getComponent('pTreeGroups').getRootNode() ,
				sdomainNode = treeGroupsRoot.findChild('sdomain_id',groupRecord.get('sdomain_id')) ,
				groupNode = (sdomainNode != null) ? sdomainNode.findChild('group_id',groupId) : null ,
				userNode = (groupNode != null) ? groupNode.findChild('user_id',userId) : null ;
		if( userNode != null ) {
			userNode.remove();
		}
		
	},
	ugShowSave: function() {
		var me = this ;
		me.getComponent('mAuthList').child('toolbar').getComponent('tbSavePermBtn').show() ;
	},
	ugSubmit: function( userId ) {
		var me = this,
			oUserLinkGroups = {} ;
		
		var records = userId ? [me.stores.usersStore.getById(userId)] : me.stores.usersStore.getRange() ;
		for (var i = 0; i < records.length; i++) {
			var userRecord = records[i] ;
			if( userRecord == null ) {
				continue ;
			}
			oUserLinkGroups[userRecord.getId()] = [] ;
			userRecord.link_groups().each( function(userLinkGroupRecord) {
				oUserLinkGroups[userRecord.getId()].push(userLinkGroupRecord.get('link_group_id')) ;
			},me) ;
		}
		
		
		var ajaxParams = {} ;
		Ext.apply( ajaxParams, {
			_action: 'auth_uglinks_set',
					  
			data: Ext.JSON.encode(oUserLinkGroups)
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				} else {
					me.getComponent('mAuthList').child('toolbar').getComponent('tbSavePermBtn').hide() ;
				}
			},
			scope: me
		});
	},
	
	endFormpanelAction: function() {
		var me = this,
			mgroupformcontainer = me.getComponent('mGroupFormContainer'),
			muserformcontainer = me.getComponent('mUserFormContainer') ;
		
		// ** Clear du formpanel ***
		mgroupformcontainer.removeAll() ;
		mgroupformcontainer.setTitle('') ;
		mgroupformcontainer.collapse(false) ;
		mgroupformcontainer.empty = true ;
		
		// ** Clear du formpanel ***
		muserformcontainer.removeAll() ;
		muserformcontainer.setTitle('') ;
		muserformcontainer.collapse(false) ;
		muserformcontainer.empty = true ;
		
		// ** Reload list ***
		me.load() ;
	}	
});