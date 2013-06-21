Ext.define('AuthGroupActionsTreeModel', {
	extend: 'Ext.data.Model',
	fields: [
		{name: 'id',  type: 'int'}, // dummy ID as tree is built for display purposes only
		{name: 'text', type:'string'},
		{name: '_type', type:'string'},
		{name: 'action_code',  type: 'string'},
		{name: 'action_param_is_wildcard',  type: 'boolean'},
		{name: 'action_param_data',  type: 'string'},
		{name: 'auth_has_read', type:'boolean'},
		{name: 'auth_has_write',  type: 'boolean'}
	]
});

Ext.define('Optima5.Modules.Admin.AuthGroupFormCheckColumn',{
	extend: 'Ext.ux.CheckColumn',
	
	renderer: function(value, metaData, record) {
		if( record.isRoot() ) {
			return '&#160;' ;
		}
		return this.callParent(arguments) ;
	}
});
Ext.define('Optima5.Modules.Admin.AuthGroupForm' ,{
	extend: 'Ext.panel.Panel',
			  
	requires: [
		'Ext.ux.dams.ModelManager'
	] ,
	
	isNew: false,
	groupId: null,
	sdomainId: null,
	
	loaded:false,
	loadedAdminAuthGroupRecord: null,
	loadedSdomainRecord: null,
			  
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsForm','No module reference ?') ;
		}
		
		Ext.apply(me,{
			layout:{
				type:'vbox',
				align:'stretch'
			},
			tbar:[{
				iconCls:'op5-auth-menu-save',
				itemId:'tbSaveBtn',
				text:'Save',
				hidden:true,
				handler: function() {
					me.saveRecord() ;
				},
				scope:me
			},{
				iconCls:'op5-auth-menu-delete',
				itemId:'tbDeleteBtn',
				text:'Delete',
				hidden:true,
				handler: function() {
					me.deleteRecord() ;
				},
				scope:me
			}],
			items:[]
		});
		
		this.callParent() ;
		
		// console.dir( me.query('combobox') ) ;
		me.on('afterrender',function() {
			me.loadMask = new Ext.LoadMask(me, {msg:'Loading...'});
			me.loadMask.show() ;
		},me) ;
		me.on('destroy',function() {
			if( me.loadmask ) {
				me.loadmask.destroy() ;
			}
		},me) ;
	},
	loadRecord: function( adminAuthGroupRecord, sdomainId ) {
		var me = this ;
		me.loaded = false ;
		
		if( adminAuthGroupRecord != null ) {
			me.isNew = false ;
			me.loadedAdminAuthGroupRecord = adminAuthGroupRecord ;
			me.groupId = adminAuthGroupRecord.getId() ;
			me.sdomainId = adminAuthGroupRecord.get('sdomain_id') ;
		} else if( sdomainId != null ) {
			me.isNew = true ;
			me.loadedAdminAuthGroupRecord = null ;
			me.groupId = null ;
			me.sdomainId = sdomainId ;
		} else {
			Ext.Msg.alert('Failed', 'Unknown error');
			return ;
		}
			
		
		// loadMask ?
		me.child('toolbar').getComponent('tbSaveBtn').show() ;
		if( !me.isNew ) {
			me.child('toolbar').getComponent('tbDeleteBtn').show() ;
		}
		
		// creation formulaire
		var form = Ext.create('Ext.form.Panel',{
			itemId:'mForm',
			border: false,
			frame:false,
			bodyPadding: 10,
			flex:1,
			bodyCls: 'ux-noframe-bg',
			defaults: {
				//anchor: '100%'
			},
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'left',
				labelSeparator: '',
				labelWidth: 125
			},
			items:[{
				xtype:'textfield',
				name:'group_name',
				fieldLabel:'Group Desc',
				anchor:'100%',
				value: me.isNew ? null : me.loadedAdminAuthGroupRecord.get('group_name')
			},{
				xtype:'fieldset',
				title: 'Sdomain administrator group',
				items:[{
					xtype:'checkboxfield',
					name:'auth_has_all',
					fieldLabel:'Has all permissions',
					inputValue:1,
					uncheckedValue:0,
					checked : me.isNew ? false : me.loadedAdminAuthGroupRecord.get('auth_has_all')
				},{
					xtype:'component',
					itemId:'overwrite_msg',
					html:'Members are enabled to all actions including data definition',
					style: 'color:#FF0000; font-weight:bold',
					padding: '0 0 5 5',
					hidden:true
				}]
			}]
		});
		form.getForm().getFields().each(function(field) {
			field.on('change', me.onFormChange, me) ;
		},me) ;
		
		// creation arbre (sans root node)
		var tree = Ext.create('Ext.tree.Panel',{
			itemId:'mTree',
			flex:3,
			hidden:true,
			rootVisible: true,
			useArrows: true,
			title:'Authorized Actions',
			iconCls:'op5-auth-panel-groups',
			store:{
				model:'AuthGroupActionsTreeModel',
				root:null,
				rootDisabled:{
					iconCls:'',
					icon:Ext.BLANK_IMAGE_URL,
					text:'',
					children:[]
				}
			},
			columns:[{
				xtype:'treecolumn',
				flex:1,
				text: 'Action > Item',
				sortable: false,
				dataIndex: 'text',
				menuDisabled: true,
				listeners:{
					checkchange: me.onTreeCheck,
					scope:me
				}
			},Ext.create('Optima5.Modules.Admin.AuthGroupFormCheckColumn',{
				width:50,
				text: '<b>Read</b>',
				sortable: false,
				dataIndex: 'auth_has_read',
				menuDisabled: true,
				listeners:{
					checkchange: me.onTreeCheck,
					scope:me
				}
			}),Ext.create('Optima5.Modules.Admin.AuthGroupFormCheckColumn',{
				xtype:'checkcolumn',
				width:50,
				text: '<b>Write</b>',
				sortable: false,
				dataIndex: 'auth_has_write',
				menuDisabled: true,
				listeners:{
					checkchange: me.onTreeCheck,
					scope:me
				}
			})],
			listeners: {
				scrollershow: function(scroller) {
					if (scroller && scroller.scrollEl) {
						scroller.clearManagedListeners(); 
						scroller.mon(scroller.scrollEl, 'scroll', scroller.onElScroll, scroller); 
					}
				},
				scope:me
			}
		}) ;
		
		me.removeAll() ;
		me.add([form,tree]) ;
		me.onFormChange() ;
		
		// lancement load sdomain
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:{
				_action: 'sdomains_getList',
				sdomain_id: me.sdomainId
			},
			success : function(response) {
				var responseObj = Ext.decode(response.responseText) ;
				if( responseObj.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					me.onRemoteSdomainLoad( responseObj ) ;
				}
			},
			failure: function(form,action){
				Ext.Msg.alert('Failed', 'Unknown error');
			},
			scope: me
		}) ;
	},
	onRemoteSdomainLoad: function( responseObj ) {
		var me = this ;
		
		if( responseObj.data.length == 1 ) {
			me.loadedSdomainRecord = Ext.ux.dams.ModelManager.create('AdminSdomainModel',responseObj.data[0]) ;
		} else {
			Ext.Msg.alert('Failed', 'Unknown error');
		}
		
		// lancement load 
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:{
				_action: 'auth_getSdomainActionsTree',
				sdomain_id: me.sdomainId
			},
			success : function(response) {
				var responseObj = Ext.decode(response.responseText) ;
				if( responseObj.success == false ) {
					Ext.Msg.alert('Failed', 'Unknown error');
				}
				else {
					me.onRemoteActionsTreeLoad( responseObj ) ;
				}
			},
			failure: function(form,action){
				Ext.Msg.alert('Failed', 'Unknown error');
			},
			scope: me
		}) ;
	},
	onRemoteActionsTreeLoad: function( responseObj ) {
		var me = this,
			mTree = me.getComponent('mTree') ;
		
		// construction du tree
		mTree.setRootNode({
			text:'<b><u>' + me.loadedSdomainRecord.get('sdomain_name') + '</u></i>',
			iconCls: Optima5.Helper.getIconsLib().iconGetCls16( me.loadedSdomainRecord.get('icon_code') ),
			children: me.onRemoteActionsTreeLoad_processChildren( responseObj.children )
		}) ;
		
		// restore group actions into tree
		if( !me.isNew && !me.loadedAdminAuthGroupRecord.get('auth_has_all') ) {
			me.loadedAdminAuthGroupRecord.actions().each(function(groupActionRecord) {
				var targetNode = mTree.getRootNode().findChildBy( function( searchNode ) {
					if( searchNode.get('action_code') == groupActionRecord.get('action_code')
						&& searchNode.get('action_param_is_wildcard') == groupActionRecord.get('action_param_is_wildcard')
						&& searchNode.get('action_param_data') == groupActionRecord.get('action_param_data') ) {
						
						return true ;
					}
				},me,true) ;
				if( targetNode == null ) {
					//console.log( 'Not Found for :' ) ;
					//console.dir( groupActionRecord ) ;
					return ;
				}
				
				//console.log( 'Found target for :' ) ;
				//console.dir( groupActionRecord ) ;
				if( groupActionRecord.get('auth_has_read') ) {
					targetNode.set('auth_has_read',true) ;
					me.onTreeCheck('auth_has_read',targetNode) ;
				}
				if( groupActionRecord.get('auth_has_write') ) {
					targetNode.set('auth_has_write',true) ;
					me.onTreeCheck('auth_has_write',targetNode) ;
				}
			},me);
		}
		
		Ext.defer(function(){
			me.loadMask.destroy();
		},200,me);
	},
	onRemoteActionsTreeLoad_processChildren: function( srcChildren ) {
		var me = this ,
			dstChildren = [] ;
		Ext.Array.each( srcChildren, function( srcChild ) {
			dstChildren.push({
				iconCls: '',
				icon: srcChild.icon,
				text: srcChild.text,
				leaf: ( typeof srcChild.children == 'undefined' ) ,
				children: ( typeof srcChild.children !== 'undefined' ) ? me.onRemoteActionsTreeLoad_processChildren( srcChild.children ) : null,
				action_code: srcChild.action_code,
				action_param_is_wildcard: srcChild.action_param_is_wildcard,
				action_param_data: srcChild.action_param_data
			}) ;
		},me) ;
		return dstChildren ;
	},
	
	
	
	onFormChange: function() {
		var me = this ,
			formAttributes = me.getComponent('mForm') ,
			authHasAll = formAttributes.getForm().findField('auth_has_all').getValue() ;
		
		formAttributes.query('#overwrite_msg')[0].setVisible( authHasAll );
		me.getComponent('mTree').setVisible( !authHasAll );
		//me.getComponent('mForm').flex = ( authHasAll ? 1 : 0 ) ;
		
		me.doLayout() ;
	},
	onTreeCheck: function( columnDefinition, nodeRecord ) {
		var me = this,
			dataIndex = ( Ext.isObject(columnDefinition) ? columnDefinition.dataIndex : columnDefinition ) ;
		
		// traitement specifique auth_has_write
		if( dataIndex == 'auth_has_write' ) {
			// si read pas mis, on ejecte le write
			if( nodeRecord.get('auth_has_write') && !nodeRecord.get('auth_has_read') ) {
				nodeRecord.set('auth_has_write',false) ;
				return ;
			}
			
			// si read + write 
			nodeRecord.set('expandable', !nodeRecord.get('auth_has_write') );
			if( !nodeRecord.isExpandable() && nodeRecord.isExpanded() ) {
				nodeRecord.collapse() ;
			}
		}
		// traitement specifique auth_has_read
		if( dataIndex == 'auth_has_read' ) {
			// si write mis, on laisse le read
			if( nodeRecord.get('auth_has_write') && !nodeRecord.get('auth_has_read') ) {
				nodeRecord.set('auth_has_read',true) ;
				return ;
			}
		}
		
		switch( dataIndex ) {
			case 'auth_has_read' :
			case 'auth_has_write' :
				var parentNode = nodeRecord ;
				while( true ) {
					parentNode = parentNode.parentNode ;
					if( parentNode == null ) {
						break ;
					}
					if( !parentNode.isExpanded() ) {
						parentNode.expand();
					}
				}
				if( nodeRecord.parentNode.get(dataIndex) ) {
					nodeRecord.set(dataIndex,true) ;
				}
				var valueToCascade = nodeRecord.get(dataIndex) ;
				nodeRecord.cascadeBy( function(childNode) {
					childNode.set(dataIndex,valueToCascade) ;
				},me);
				break ;
		}
	},
	
	
	saveRecord: function() {
		var me=this,
			actions = [] ,
			rootNode = me.getComponent('mTree').getRootNode() ;
			
		me.loadMask = new Ext.LoadMask(me, {msg:'Saving...'});
		me.loadMask.show() ;
		
		var values = me.getComponent('mForm').getValues() ;
		if( me.isNew ) {
			values['_is_new'] = 1 ;
			values['sdomain_id'] = me.sdomainId ;
		} else {
			values['group_id'] = me.groupId ;
		}
		
		rootNode.cascadeBy( function(nodeRecord) {
			if( nodeRecord.get('auth_has_write') ) {
				actions.push({
					action_code: nodeRecord.get('action_code'),
					action_param_is_wildcard: nodeRecord.get('action_param_is_wildcard'),
					action_param_data: nodeRecord.get('action_param_data'),
					auth_has_read: true,
					auth_has_write: true
				});
				// Stop deeper iteration
				return false ;
			}
		},me) ;
		rootNode.cascadeBy( function(nodeRecord) {
			if( nodeRecord.get('auth_has_read') && !nodeRecord.get('auth_has_write') ) {
				actions.push({
					action_code: nodeRecord.get('action_code'),
					action_param_is_wildcard: nodeRecord.get('action_param_is_wildcard'),
					action_param_data: nodeRecord.get('action_param_data'),
					auth_has_read: true,
					auth_has_write: false
				});
				// Stop deeper iteration
				return false ;
			}
		},me) ;
		Ext.apply(values,{
			actions: Ext.JSON.encode(actions)
		}) ;
		//console.dir(actions) ;
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply(values,{
				_action: 'auth_setGroup'
			}),
			callback: function() {
				me.loadMask.destroy() ;
			},
			success : function(response) {
				var responseObj = Ext.decode(response.responseText) ;
				if( responseObj.success == false ) {
					if( responseObj.errors ) {
						me.getComponent('mForm').getForm().markInvalid(responseObj.errors) ;
					}
					if( responseObj.msg != null ) {
						Ext.Msg.alert('Failed', responseObj.msg);
					}
				}
				else {
					me.optimaModule.postCrmEvent('authchange',{
						groupId: values.group_id
					}) ;
				}
			},
			failure: function(form,action){
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
	},
	deleteRecord: function() {
		var me = this ;
		if( me.isNew ) {
			return ;
		}
		Ext.Msg.confirm('Delete','Delete group ?',function(btn){
			if( btn == 'yes' ) {
				me.loadMask = new Ext.LoadMask(me, {msg:'Deleting...'});
				me.loadMask.show() ;
				
				me.optimaModule.getConfiguredAjaxConnection().request({
					params:{
						_action: 'auth_deleteGroup',
						group_id: me.groupId
					},
					callback: function() {
						me.loadMask.destroy() ;
					},
					success : function(response) {
						if( Ext.decode(response.responseText).success == false ) {
							Ext.Msg.alert('Failed', 'Delete failed. Unknown error');
						}
						else {
							me.optimaModule.postCrmEvent('authchange',{
								groupId: me.groupId
							}) ;
						}
					},
					failure: function(form,action){
						if( action.result && action.result.msg )
							Ext.Msg.alert('Failed', action.result.msg);
					},
					scope: me
				}) ;
			}
		},me);
	}
});