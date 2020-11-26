Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',{
	extend:'Ext.form.Panel',
	
	requires: [
		'Optima5.Modules.Spec.RsiRecouveo.CommonMailTemplateButton'
	],
	
	_fileRecord: null,
	
	initComponent: function() {
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Type d\'action',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				defaults: {
					anchor: '100%',
					labelWidth: 80
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Courrier / Mail Sortant</b>'
				},{
					itemId: 'btnTemplates',
					xtype: 'container',
					height: 48,
					layout: {
						type: 'hbox',
						pack: 'end'
					},
					items: [{
						xtype: 'hiddenfield',
						name: 'tpl_id'
					},
						Ext.create('Optima5.Modules.Spec.RsiRecouveo.CommonMailTemplateButton',{
							_actionForm: this._actionForm,
							optimaModule: this.optimaModule,
							renderTarget: this._actionForm.getEl(),
							listeners: {
								select: function(p,tplId) {
									this.onSelectTpl(tplId) ;
								},
								scope: this
							}
						})
					]
 				}]
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'stretch'
				},
				items: [{
						xtype: 'fieldset',
						flex: 1,
						defaults: {
							anchor: '100%'
						},
						itemId: 'fsAdrPost',
						title: 'Envoi postal',
						items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookTypeContainer',{
							//xtype: 'container',
							itemId: 'cntAdrPost',

							optimaModule: this.optimaModule,
							_accountRecord : this._accountRecord,

							_adrType: 'POSTAL',
							_showNew: true,
							_showResult: false,
							_showValidation: false
						})

				},{
					xtype: 'box',
					width: 16
				},{
					xtype: 'container',
					flex: 1,
					layout: {
						type: 'anchor'
					},
					defaults: {
						anchor: '100%'
					},
					items: [{
						xtype: 'fieldset',
						hidden: true,
						itemId: 'fsMailFieldsCnt',
						padding: 10,
						title: 'Paramètres additionnels',
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%',
							labelWidth: 80
						},
						items: []
					},{
						xtype: 'fieldset',
						padding: 6,
						title: 'Pièces jointes',
						layout: 'fit',
						items: [Ext.create('Optima5.Modules.Spec.RsiRecouveo.AttachmentsFieldPanel',{
							name: 'attachments',
							optimaModule: this.optimaModule
						})]
					}]
				}]
			},{
				xtype: 'textfield',
				fieldLabel: 'Titre',
				itemId: 'input_title',
				name: 'input_title',
				readOnly: true
			},{
				xtype: 'htmleditor',
				enableColors: true,
				enableAlignements: true,
				itemId: 'input_html',
				name: 'input_html'
			}]
		}) ;

		this.callParent() ;
	},
	onSelectTpl: function( tplId ) {
		// DM 26/11/2020 : tpl_id pour repagination au niveau -action-
		this.getForm().findField('tpl_id').setValue(tplId) ;
		
		this.getEl().mask() ;
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'action_execMailAutoTemplate',
				file_filerecord_id: this._fileRecord.get('file_filerecord_id'),
				fileaction_filerecord_id: this._fileActionFilerecordId,
				tpl_id: tplId,
				adr_type: 'POSTAL'
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					var error = ajaxResponse.success || 'File not saved !' ;
					Ext.MessageBox.alert('Error',error) ;
					return ;
				}
				
				var formData = {} ;
				formData['input_title'] = ajaxResponse.data.subject ;
				formData['input_html'] = ajaxResponse.data.body_html.replace(/(\r\n|\n|\r)/gm, "") ;
				this._actionForm.getForm().setValues(formData) ;
			},
			callback: function() {
				this.getEl().unmask() ;
			},
			scope: this
		}) ;
	},
}) ;
