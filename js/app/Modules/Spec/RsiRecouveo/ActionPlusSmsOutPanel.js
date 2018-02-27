Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusSmsOutPanel',{
	extend:'Ext.form.Panel',

	mixins: ['Ext.form.field.Field'],

	_fileRecord: null,
  initComponent: function() {

		var tableau = [];
		this._accountRecord.adrbook().each( function( adrbook ) {
			adrbook.adrbookentries().each( function(adrbookentries) {

				if (adrbookentries.get('adr_type') == 'TEL' && adrbookentries.get('status_is_invalid') == false){

					tableau.push({"nom": adrbook.get('adr_entity'), "tel": adrbookentries.get('adr_txt')});
					//emails.add({'nom': adrbook.get('adr_entity'), 'email' : adrbookentries.get('adr_txt')});

				}

			},this) ;
		},this) ;

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
					value: '<b>Envoi de SMS</b>'
				}]
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				items: [{
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
						layout: {
							type: 'anchor'
						},
						defaults: {
							anchor: '100%'
						},

						itemId: 'fsAdrTel',
						title: 'SMS',
						items: Ext.create('Optima5.Modules.Spec.RsiRecouveo.AdrbookTypeContainer',{
							//xtype: 'container',
							itemId: 'cntAdrTel',

							optimaModule: this.optimaModule,
							_accountRecord : this._accountRecord,

							_adrType: 'TEL',
							_showNew: true,
							_showResult: false,
							_showValidation: false

						})
					}]
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
            title: 'Contenu',
            layout: 'fit',
            items: [{
              xtype: 'textareafield',
              name: 'sms_content',
              grow: true,
              fieldLabel: 'Message',

            }]
          }]
				}]
			}]
		}) ;


		this.callParent() ;
	},

	onTplChange: function(tplRecord) {
		var jsonFields = tplRecord.get('input_fields_json'),
			fields = Ext.JSON.decode(jsonFields,true),
			fsMailFieldsCnt = this.down('#fsMailFieldsCnt'),
			fsFields = [] ;
		fsMailFieldsCnt.removeAll() ;
		if( !Ext.isArray(fields) || fields.length==0 ) {
			fsMailFieldsCnt.setVisible(false) ;
			return ;
		}
		fsMailFieldsCnt.setVisible(true) ;
		Ext.Array.each( fields, function(fieldDefinition) {
			fsFields.push(fieldDefinition) ;
		}) ;
		fsMailFieldsCnt.add(fsFields) ;
	},

})
