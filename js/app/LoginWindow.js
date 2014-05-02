/*
 * References :
 * http://stackoverflow.com/questions/14920869/how-to-display-image-on-center-extjs-4
 */
Ext.define('Optima5.LoginWindow',{
	extend  :'Ext.window.Window',
	
	loginSent: false,
	
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
					labelWidth: 200
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
		
		me.probeAutoLogin() ;
	},
	probeAutoLogin: function() {
		var isIPAddress = function(v) {
			return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(v);
		} ;
		if( !isIPAddress(window.location.hostname) ) {
			return ;
		}
		/*
		 * Optional /DEV
		 * + /DEV.autologin.json :
		 * {
		 *    "login_domain":"",
		 *    "login_user":"",
		 *    "login_password":""
		 * }
		 */
		var me = this ;
		Ext.Ajax.request({
			url: 'DEV',
			success: function() {
				Ext.Ajax.request({
					url: 'DEV.autologin.json',
					success: function(response) {
						var responseObj ;
						try {
							responseObj = Ext.decode(response.responseText);
						} catch(e) {
							return ;
						}
						var form = me.child('form').getForm() ;
						form.findField('user').setValue(responseObj.login_user+'@'+responseObj.login_domain) ;
						form.findField('password').setValue(responseObj.login_password) ;
						me.doLogin() ;
					},
					scope:me
				});
			},
			scope:me
		});
	},
	doLogin: function() {
		var me = this ;
		if( me.loginSent ) {
			return ;
		}
		
		me.loginSent=true;
		Ext.getBody().mask('Logging in...') ;
		me.child('form').query('#btnEnter')[0].setDisabled(true) ;
		
		var form = me.child('form').getForm() ;
		var userStr = form.findField('user').getValue() ;
		var passStr = form.findField('password').getValue() ;
		
		var tarr = (userStr!='') ? userStr.split('@') : []
			, loginDomain, loginUser
			, loginPass = passStr ;
		switch( tarr.length ) {
			case 2 :
				loginUser = tarr[0];
				loginDomain = tarr[1];
				break ;
			case 1 :
				loginUser = 'root' ;
				loginDomain = tarr[0];
				break ;
			default :
				Ext.MessageBox.alert('Login failed', 'Invalid user parameter (user@domain)');
				me.recycle() ;
				return ;
		}
		
		Ext.Ajax.request({
			url: 'server/login.php',
			params: {
				_action: 'login',
				login_domain: loginDomain,
				login_user  : loginUser,
				login_password: loginPass
			},
			success: function(response) {
				if( Ext.decode(response.responseText).done == false ) {
					if( Ext.decode(response.responseText).errors )
						var mstr = Ext.decode(response.responseText).errors.join('\n') ;
					else
						var mstr = 'Cannot open session. Contact admin.' ;
					/*
					Ext.Msg.alert('Initialization error', mstr,function(){
						window.location.reload() ;
					}) ;
					*/
					me.fireEvent('loginfailed',me, mstr) ;
					return ;
				}
				
				var objLoginData = Ext.decode(response.responseText).login_data ;
				//console.dir( Ext.decode(response.responseText).login_data ) ;
				me.fireEvent('loginsuccess',me, objLoginData['session_id']) ;
				return ;
			},
			scope : me
		});
	},
	recycle: function() {
		var me = this ;
		var form = me.child('form').getForm() ;
		form.findField('password').setValue() ;
		me.child('form').query('#btnEnter')[0].setDisabled(false) ;
		me.loginSent = false ;
		Ext.getBody().unmask() ;
	},
	
	onBeforeDestroy: function() {
		var me = this,
			docBody = Ext.getBody() ;
		if( docBody.isMasked() ) {
			docBody.unmask() ;
		}
	}
	
});