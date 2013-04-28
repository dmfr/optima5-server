/*
 * References :
 * http://stackoverflow.com/questions/14920869/how-to-display-image-on-center-extjs-4
 */
Ext.define('Optima5.LoginWindow',{
	extend  :'Ext.window.Window',
	
	loginSent: false,
	loadMask: null,
	
	initComponent:function() {
		var me = this ;
		me.addEvents('loginsuccess','loginfailed') ;
		
		Ext.apply(me,{
			title: 'Optima Desktop / Login',
			width: 550,
			height: 200,
			layout: 'border',
			resizable: false,
			plain: true,
			closable: false,
			style:{
				'display': 'table-cell',
				'vertical-align': 'middle'
			},
			items:[{
				region: 'west',
				xtype:'container',
				width:155,
				cls:'op5-login-west'
				/*
				style:{
					background:"url('images/AquaSafari_logo.png') no-repeat center center"
				},
				*/
				/*
				items:[{
					xtype:'image',
					src:'images/AquaSafari_logo.png',
					style: {
						'display': 'block',
						'margin': 'auto',
					}
				}]
				*/
			},{
				xtype:'form',
				frame:true,
				bodyPadding: 10,
				region: 'center',
				defaultType: 'textfield',
				fieldDefaults: {
						labelAlign: 'left',
						anchor: '100%',
						margin: '10 0 15 0'
				},
				listeners: {
					afterRender: function(thisForm, options){
						this.keyNav = Ext.create('Ext.util.KeyNav', this.el, {                    
								enter: me.doLogin,
								scope: me
						});
					}
				},
				items: [{
					xtype:'displayfield',
					labelSeparator: ' :',
					fieldLabel: '<b>Please enter login information</b>',
					margin: '0 0 15 0',
					labelWidth: '100%'
				},{
					fieldLabel: 'User @ Domain',
					allowBlank: false,
					msgTarget:'side',
					name: 'user'
				},{
					fieldLabel: 'Password',
					inputType: 'password',
					name: 'password'
				}],
				buttons: [{
					itemId: 'btnEnter',
					text: "Login",
					handler: me.doLogin,
					scope:me
				}]
			}]
		});
		
		this.callParent() ;
		
		me.on('beforedestroy',me.onBeforeDestroy,me) ;
	},
	doLogin: function() {
		var me = this ;
		if( me.loginSent ) {
			return ;
		}
		me.loginSent=true;
		if( me.loadMask == null ) {
			me.loadMask = new Ext.LoadMask(Ext.getBody(), {msg:'Logging in...'});
		}
		me.loadMask.show();

		
		me.child('form').query('#btnEnter')[0].setDisabled(true) ;
		
		var form = me.child('form').getForm() ;
		var userStr = form.findField('user').getValue() ;
		var passStr = form.findField('password').getValue() ;
		console.log('Login: '+userStr+':'+passStr) ;
		
		Ext.defer(function() {
			me.fireEvent('loginfailed',me) ;
		},2000,me) ;
	},
	recycle: function() {
		var me = this ;
		var form = me.child('form').getForm() ;
		form.findField('password').setValue() ;
		me.child('form').query('#btnEnter')[0].setDisabled(false) ;
		me.loginSent = false ;
		if( me.loadMask != null ) {
			me.loadMask.hide();
		}
	},
	
	onBeforeDestroy: function() {
		var me = this ;
		if( me.loadMask != null ) {
			me.loadMask.hide();
		}
	}
	
});