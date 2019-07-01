Ext.define('Optima5.Modules.Spec.RsiRecouveo.ConfigUsersPanel', {
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
				columns: [{
					dataIndex: 'user_id',
					text: 'ID',
					renderer: function(v) {
						return '<b>'+v+'</b>' ;
					}
				},{
					width: 60,
					dataIndex: 'user_short',
					text: 'Initiales'
				},{
					width: 160,
					dataIndex: 'user_fullname',
					text: 'Nom'
				},{
					width: 160,
					dataIndex: 'user_email',
					text: 'Email'
				},{
					width: 90,
					dataIndex: 'user_tel',
					text: 'Téléphone'
				}],
				store: {
					autoLoad: true,
					model: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getConfigUserModel(),
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'config_getUsers'
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
				items: Ext.Array.merge([{
					xtype: 'hiddenfield',
					name: 'id'
				},{
					xtype: 'textfield',
					name: 'user_id',
					fieldLabel: 'ID utilisateur',
					anchor: '60%'
				},{
					xtype: 'textfield',
					name: 'user_pw',
					fieldLabel: 'Password',
					anchor: '60%'
				},{
					xtype: 'textfield',
					name: 'user_short',
					fieldLabel: 'Initiales',
					anchor: '',
					width: 150
				},{
					xtype: 'textfield',
					name: 'user_fullname',
					fieldLabel: 'Nom complet'
				},{
					xtype: 'textfield',
					name: 'user_jobtitle',
					fieldLabel: 'Fonction'
				},{
					xtype: 'textfield',
					name: 'user_email',
					fieldLabel: 'Email'
				},{
					xtype: 'textfield',
					name: 'user_tel',
					fieldLabel: 'Téléphone'
				},{
					xtype: 'combobox',
					name: 'user_class',
					fieldLabel: 'Profil',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['id','txt'],
						data : [
							{id:'CR', txt:'Chargé de recouvrement'},
							{id:'CR_AFF', txt:'CR (avec affectation)'},
							{id:'EXT', txt:'Externe pour traitement ltg'},
							{id:'SUPER', txt:'Superviseur'},
							{id:'DEFAULT', txt:'Compte par défaut (non aff.)'}
						]
					},
					queryMode: 'local',
					displayField: 'txt',
					valueField: 'id'
				},{
					xtype: 'fieldset',
					checkboxToggle: true,
					checkboxName: 'user_signature_is_on',
					title: 'Signature personnelle (Email/Courriers)',
					items: [{
						labelWidth: 120,
						xtype: 'textarea',
						name: 'user_signature_html',
						fieldLabel: 'Signature(HTML)'
					}]
				}],{
					xtype: 'fieldset',
					title: 'Affectation litiges',
					items: [{
						readOnly: true,
						xtype: 'checkboxfield',
						boxLabel: 'Utilisateur externe pour affectation',
						name: 'status_is_ext'
					}]
				},{
					xtype: 'fieldset',
					title: 'Entités',
					items: [{
						xtype: 'op5crmbasebibletreepicker',
						optimaModule: this.optimaModule,
						bibleId: 'LIB_ACCOUNT',
						name: 'link_SOC',
						fieldLabel: 'Entités'
					}]
				}),
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
		this.down('#cntEast').getForm().getFields().each(function(field) {
			field.on('change',function(){
				this.calcLayout() ;
			},this) ;
		},this) ;
	},
	
	calcLayout: function() {
		var form = this.down('#cntEast').getForm() ;
		form.findField('status_is_ext').setValue( form.findField('user_class').getValue()=='EXT' ) ;
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
				_action: 'config_setUser',
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
	
	
	setFormRecord: function(userRecord) {
		var me = this,
			eastpanel = me.down('#cntEast') ;
		if( userRecord == null ) {
			eastpanel._empty = true ;
			eastpanel.collapse() ;
			eastpanel.reset() ;
			return ;
		}
		
		var title,values ;
		if( userRecord.get('_is_new') ) {
			title = 'Création utilisateur' ;
			values = {} ;
		} else {
			title = 'Modification: '+userRecord.getId() ;
			values = userRecord.getData() ;
			values['id'] = userRecord.getId() ;
		}
		
		
		eastpanel._empty = false ;
		eastpanel.setTitle(title) ;
		eastpanel.getForm().reset() ;
		eastpanel.getForm().setValues( values ) ;
		eastpanel.getForm().findField('user_id').setReadOnly( !userRecord.get('_is_new') ) ;
		eastpanel.down('#btnDelete').setVisible( !userRecord.get('_is_new') ) ;
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
			msg:RsiRecouveoLoadMsg.loadMsg
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
