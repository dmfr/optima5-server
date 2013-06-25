Ext.define('Optima5.Modules.Admin.AuthUserForm' ,{
	extend: 'Ext.form.Panel',
	
	requires: [] ,
	
	isNew: false,
	userId: null,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('Admin:SdomainsForm','No module reference ?') ;
		}
		
		Ext.apply(me,{
			layout:'fit',
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
		me.on('destroy',function() {
			if( me.loadmask ) {
				me.loadmask.destroy() ;
			}
		},me) ;
	},
	loadRecord: function( adminAuthUserRecord ) {
		var me = this ;
		
		if( adminAuthUserRecord != null ) {
			me.isNew = false ;
			me.userId = adminAuthUserRecord.getId() ;
		} else {
			me.isNew = true ;
			me.userId = null ;
		}
		
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
				labelSeparator: ''
				//labelWidth: 125
			},
			items:[{
				xtype:'textfield',
				name:'user_id',
				fieldLabel:'User ID',
				width: 220,
				value: me.isNew ? null : adminAuthUserRecord.get('user_id')
			},{
				xtype:'textfield',
				name:'user_fullname',
				fieldLabel:'Full name',
				anchor:'100%',
				value: me.isNew ? null : adminAuthUserRecord.get('user_fullname')
			},{
				xtype:'textfield',
				name:'user_email',
				fieldLabel:'Email',
				anchor:'100%',
				value: me.isNew ? null : adminAuthUserRecord.get('user_email')
			},{
				xtype:'checkboxfield',
				name:'auth_is_disabled',
				fieldLabel:'Login disabled',
				inputValue:1,
				uncheckedValue:0,
				checked : me.isNew ? false : adminAuthUserRecord.get('auth_is_disabled')
			},{
				xtype:'fieldset',
				title: 'Administrator',
				items:[{
					xtype:'checkboxfield',
					name:'auth_is_admin',
					fieldLabel:'Is Administrator',
					inputValue:1,
					uncheckedValue:0,
					checked : me.isNew ? false : adminAuthUserRecord.get('auth_is_admin')
				},{
					xtype:'component',
					itemId:'overwrite_msg',
					html:'Warning ! Complete Domain control',
					style: 'color:#FF0000; font-weight:bold',
					padding: '0 0 5 5',
					hidden:true
				}]
			},{
				xtype:'fieldset',
				title: 'Password',
				items:[{
					xtype:'checkboxfield',
					name:'password_do_set',
					fieldLabel:'Reset password',
					inputValue:1,
					uncheckedValue:0,
					checked : me.isNew,
					hidden: me.isNew
				},{
					xtype:'textfield',
					name:'password_plain',
					fieldLabel:'New password',
					width: 220,
					value: ''
				}]
			}]
		});
		form.getForm().getFields().each(function(field) {
			field.on('change', me.onFormChange, me) ;
		},me) ;
		
		me.removeAll() ;
		me.add([form]) ;
		me.onFormChange() ;
	},
	onFormChange: function() {
		var me = this ,
			formAttributes = me.getComponent('mForm') ;
		
		formAttributes.query('#overwrite_msg')[0].setVisible( formAttributes.getForm().findField('auth_is_admin').getValue() );
		formAttributes.getForm().findField('password_plain').setVisible( formAttributes.getForm().findField('password_do_set').getValue() );
	},
	
	saveRecord: function() {
		var me=this ;
			
		me.loadMask = new Ext.LoadMask(me, {msg:'Saving...'});
		me.loadMask.show() ;
		
		var values = me.getComponent('mForm').getValues() ;
		if( me.isNew ) {
			values['_is_new'] = 1 ;
		} else {
			values['user_id'] = me.userId ;
		}
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply(values,{
				_action: 'auth_setUser'
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
						userId: values.user_id
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
		Ext.Msg.confirm('Delete','Delete user ?',function(btn){
			if( btn == 'yes' ) {
				me.loadMask = new Ext.LoadMask(me, {msg:'Deleting...'});
				me.loadMask.show() ;
				
				me.optimaModule.getConfiguredAjaxConnection().request({
					params:{
						_action: 'auth_deleteUser',
						user_id: me.userId
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
								userId: me.userId
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
