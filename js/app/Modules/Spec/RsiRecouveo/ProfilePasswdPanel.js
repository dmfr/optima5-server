Ext.define('Optima5.Modules.Spec.RsiRecouveo.ProfilePasswdPanel',{
	extend:'Ext.panel.Panel',
	
	requires: [
		'Optima5.Modules.Settings.CardHeader'
	],
	
	initComponent: function() {
		Ext.apply(this,{
			border: false,
			frame:false,
			bodyCls: 'ux-noframe-bg',
			bodyPadding: "0 10px",
			layout: {
				type: 'vbox',
				align: 'left'
			},
			items:[Ext.create('Optima5.Modules.Settings.CardHeader',{
				width:'100%',
				data:{
					iconCls:'op5-settings-menu-password',
					title: 'Profil utilisateur',
					caption: 'Changement mot de passe / paramètres'
				}
			}),{
				xtype:'form',
				layout:'anchor',
				width:350,
				fieldDefaults: {
					labelAlign: 'left',
					labelWidth: 150,
					anchor: '100%'
				},
				bodyPadding: "24 0 0 0",
				bodyCls: 'ux-noframe-bg',
				frame:false,
				border: false,
				items:[{
					xtype:'displayfield',
					fieldLabel: 'Login',
					fieldStyle: 'font-weight:bold',
					name: 'login_str',
					value: this.optimaModule.getDesktopCfgRecord().get('login_str')
				},{
					xtype:'textfield',
					inputType: 'password',
					fieldLabel: 'Current password',
					name: 'old_password'
				},{
					xtype:'textfield',
					inputType: 'password',
					fieldLabel: 'New password',
					name: 'new_password'
				},{
					xtype:'textfield',
					inputType: 'password',
					fieldLabel: 'Confirm new password',
					name: 'confirm_password'
				}],
				buttons: [{
					xtype: 'box',
					flex: 1
				},{ 
					xtype: 'button',
					text: 'Commit',
					handler: this.handleCommit,
					scope: this
				}]
			}]
		});
		this.callParent() ;
		console.dir( this.optimaModule.getDesktopCfgRecord().getData() ) ;
		
	},
	
	handleCommit: function() {
		var formpanel = this.down('form'),
			form = formpanel.getForm(),
			formErrors = {} ;
			  
		// Valid 1 : password length
		if( form.findField('new_password').getValue().trim().length < 6 ) {
			Ext.apply(formErrors,{
				new_password: 'Password length must be > 6'
			}) ;
			form.markInvalid(formErrors) ;
			return ;
		}
		
		// Valid 1 : password chars
		if( !Ext.form.field.VTypes.alphanum(form.findField('new_password').getValue()) ) {
			Ext.apply(formErrors,{
				new_password: 'Password contains invalid characters'
			}) ;
			form.markInvalid(formErrors) ;
			return ;
		}
		
		// Valid 2 : confirmation
		if( form.findField('new_password').getValue() != form.findField('confirm_password').getValue() ) {
			Ext.apply(formErrors,{
				confirm_password: 'Password confirmation doesn\'t match'
			}) ;
			form.markInvalid(formErrors) ;
			return ;
		}
		
		var me = this ;
		me.loadMask = Ext.create('Ext.LoadMask',{
			msg:'Please wait...',
			target: me
		});
		me.loadMask.show() ;
		me.optimaModule.getConfiguredAjaxConnection().request({
			params:Ext.apply({
				_moduleId: 'spec_rsi_recouveo',
				_action: 'cfg_setPasswd'
			},form.getFieldValues()),
			callback: function() {
				me.loadMask.destroy() ;
			},
			success : function(response) {
				var jsonResponse = Ext.decode(response.responseText)
				if( jsonResponse.success == false ) {
					if( jsonResponse.errors ) {
						form.markInvalid(jsonResponse.errors) ;
					} else {
						Ext.Msg.alert('Failed', 'Change password failed');
					}
				}
				else {
					Ext.Msg.alert('Success', 'Password has been set.\nLogging out now.', function() {
						me.fireEvent('passwordchange',me) ;
					},me);
				}
			},
			failure: function(form,action){
				if( action.result && action.result.msg )
					Ext.Msg.alert('Failed', action.result.msg);
			},
			scope: me
		}) ;
	}
});
