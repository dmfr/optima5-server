Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigEmailsPanel', {
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		var atrRenderer = function(value, metaData, record, rowIndex, colIndex, store, view) {
			return value.join(',') ;
		}
		var atrColumns = [], atrFields = [] ;
		Ext.Array.each( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAllAtrIds(), function(atrId) {
		},this) ;
		
		Ext.apply(this,{
			layout: 'border',
			items:[{
				itemId: 'pCenter',
				tbar: [{
					itemId: 'tbNew',
					icon: 'images/modules/rsiveo-useradd-16.gif',
					text: 'Nouveau...',
					handler: function() {
						this.handleUserNew();
					},
					scope: this
				}],
				region: 'center',
				flex: 1,
				xtype: 'gridpanel',
				scrollable: true,
				columns: [{
					width: 250,
					dataIndex: 'email_adr',
					text: 'ID',
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					width: 250,
					dataIndex: 'email_name',
					text: 'Initiales'
				},{
					width: 300,
					dataIndex: 'server_url',
					text: 'Serveur'
				},{
					width: 100,
					align: 'center',
					dataIndex: 'link_is_default',
					text: 'Par défaut',
					renderer: function(v) {
						if(v) { return '<b>'+'X'+'</b>' ; }
					}
				}],
				store: {
					autoLoad: true,
					model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getConfigEmailModel(),
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'config_getEmails'
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					})
				},
				listeners: {
					itemclick: function(grid,record) {
						this.setFormRecord( record ) ;
					},
					scope: this
				}
			},{
				region: 'east',
				itemId: 'cntEast',
				flex: 1,
				collapsible: true,
				collapsed: true,
				_empty:true,
				scrollable: true,
				listeners:{
					beforeexpand:function(eastpanel) {
						if( eastpanel._empty ) {
							return false;
						}
					},
					scope:this
				},
				xtype: 'form',
				cls: 'ux-noframe-bg',
				layout: 'anchor',
				bodyPadding: 10,
				bodyCls: 'ux-noframe-bg',
				fieldDefaults: {
					labelWidth: 90,
					anchor: '100%'
				},
				items: [{
					xtype: 'hiddenfield',
					name: 'id'
				},{
					xtype: 'textfield',
					name: 'email_adr',
					fieldLabel: 'Adresse Email'
				},{
					xtype: 'textfield',
					name: 'email_name',
					fieldLabel: 'Nom associé'
				},{
					xtype: 'textarea',
					name: 'email_signature',
					fieldLabel: 'Signature'
				},{
					xtype: 'fieldset',
					title: 'Serveur IMAP / Exchange',
					items: [{
						xtype: 'textfield',
						name: 'server_url',
						fieldLabel: 'URL',
					},{
						xtype: 'textfield',
						name: 'server_username',
						fieldLabel: 'Username',
						anchor: '60%'
					},{
						xtype: 'textfield',
						name: 'server_passwd',
						fieldLabel: 'Password',
						anchor: '60%'
					}]
				},{
					xtype: 'fieldset',
					title: 'Serveur SMTP',
					items: [{
						xtype: 'textfield',
						name: 'smtp_url',
						fieldLabel: 'URL',
					},{
						xtype: 'textfield',
						name: 'smtp_username',
						fieldLabel: 'Username',
						anchor: '60%'
					},{
						xtype: 'textfield',
						name: 'smtp_passwd',
						fieldLabel: 'Password',
						anchor: '60%'
					}]
                },{
					xtype: 'fieldset',
					title: 'Authentification DKIM',
					items: [{
						xtype: 'textfield',
						name: 'dkim_json',
						fieldLabel: 'Config JSON'
					}]
				},{
					xtype: 'fieldset',
					title: 'Utilisation par défaut',
					items: [{
						xtype: 'checkboxfield',
						boxLabel: 'Compte utilisé par défaut',
						name: 'link_is_default'
					},{
						xtype: 'op5crmbasebibletreepicker',
						optimaModule: this.optimaModule,
						bibleId: 'LIB_ACCOUNT',
						name: 'link_SOC',
						fieldLabel: 'Entités'
					}]
				}],
				buttons: [{
					itemId: 'btnOk',
					xtype: 'button',
					text: 'OK',
					icon: 'images/modules/rsiveo-save-16.gif',
					handler: function( btn ) {
						this.handleSave() ;
					},
					scope: this
				},{
					itemId: 'btnCancel',
					xtype: 'button',
					text: 'Abandon',
					icon: 'images/modules/rsiveo-cancel-16.gif',
					handler: function( btn ) {
						this.handleCancel() ;
					},
					scope: this
				},{
					itemId: 'btnDelete',
					xtype: 'button',
					text: 'Supprimer',
					icon: 'images/op5img/ico_delete_16.gif',
					handler: function( btn ) {
						this.handleDelete() ;
					},
					scope: this
				}]
			}]
		}) ;
		this.callParent() ;
		this.setScrollable('vertical') ;
	},
	
	doReload: function() {
		this.down('#pCenter').getStore().load() ;
	},
	
	handleUserNew: function() {
		this.setFormRecord( Ext.create(Optima5.Modules.Spec.RsiRecouveo.HelperCache.getConfigUserModel(),{
			_is_new: true
		}) );
	},
	handleCancel: function() {
		this.setFormRecord(null) ;
	},
	handleSave: function(doDelete) {
		var me = this,
			eastpanel = me.down('#cntEast') ;
		if( eastpanel._empty ) {
			return ;
		}
		
		var values = eastpanel.getForm().getFieldValues() ;
		
		this.showLoadmask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'config_setEmail',
				data: Ext.JSON.encode(values),
				do_delete: (doDelete ? 1 : 0)
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.setFormRecord(null) ;
				this.doReload() ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: this
		}) ;
	},
	handleDelete: function() {
		Ext.MessageBox.confirm('Suppression','Suppression utilisateur', function(btn) {
			if( btn =='yes' ) {
				var doDelete = true ;
				this.handleSave(doDelete) ;
			}
		},this) ;
	},
	
	
	setFormRecord: function(emailRecord) {
		var me = this,
			eastpanel = me.down('#cntEast') ;
		if( emailRecord == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.reset() ;
			return ;
		}
		
		var title,values ;
		if( emailRecord.get('_is_new') ) {
			title = 'Création email' ;
			values = {} ;
		} else {
			title = ''+emailRecord.getId() ;
			values = emailRecord.getData() ;
			values['id'] = emailRecord.getId() ;
		}
		
		
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.getForm().reset() ;
		eastpanel.getForm().setValues( values ) ;
		eastpanel.getForm().findField('email_adr').setReadOnly( !emailRecord.get('_is_new') ) ;
		eastpanel.down('#btnDelete').setVisible( !emailRecord.get('_is_new') ) ;
		eastpanel.expand() ;
	},
	closeForm: function() {
		var me = this,
			eastpanel = me.down('#cntEast') ;
		eastpanel._empty = true ;
		eastpanel.collapse() ;
		eastpanel.reset() ;
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	}
}); 
