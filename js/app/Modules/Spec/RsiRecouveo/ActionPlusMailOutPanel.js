Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailOutPanel',{
	extend:'Ext.form.Panel',
	
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
					flex: 1,
					xtype: 'combobox',
					name: 'tpl_id',
					fieldLabel: 'Modèle lettre',
					forceSelection: true,
					editable: false,
					store: {
						model: 'RsiRecouveoCfgTemplateModel',
						data: Optima5.Modules.Spec.RsiRecouveo.HelperCache.getTemplateAll()
					},

					queryMode: 'local',
					displayField: 'tpl_name',
					valueField: 'tpl_id',
					listeners: {
						change: function(cmb,value) {
							var record = cmb.getStore().getById(value) ;
							this.onTplChange(record) ;
						},
						scope: this
					}
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
				name: 'input_title'
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
	onTplChange: function(tplRecord){
		var jsonFields = tplRecord.get('input_fields_json'),
			fields = Ext.JSON.decode(jsonFields,true),
			fsMailFieldsCnt = this.down('#fsMailFieldsCnt'),
			fsFields = [] ;
			
		fsMailFieldsCnt.removeAll() ;
		if( Ext.isArray(fields) ) {
			Ext.Array.each( fields, function(fieldDefinition) {
				fsFields.push(fieldDefinition) ;
			}) ;
		}
		fsMailFieldsCnt.setVisible( Ext.isArray(fields) && (fields.length>0) && false ) ; //Damien 28/02 , disable fsMailFieldsCnt
		fsMailFieldsCnt.add(fsFields) ;
		
		 
		var inputTitle = tplRecord.get('html_title') ;
		var inputHtml = tplRecord.get('html_body') ;
		var showFields = (!tplRecord || tplRecord.get('manual_is_on')) ;
		
		var titleField = this.down('#input_title') ;
		titleField.setVisible(showFields) ;
		titleField.setValue(inputTitle) ;
		
		var bodyField = this.down('#input_html') ;
		bodyField.setVisible(showFields) ;
		bodyField.setValue(inputHtml) ;
	}
}) ;
