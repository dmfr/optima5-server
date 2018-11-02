Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailAutoPanel',{
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
					value: '<b>Action automatique</b>'
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
			}]
		}) ;

		this.callParent() ;
	},
	onTplChange: function(tplRecord){
		var jsonFields = tplRecord.get('input_fields_json'),
			fields = Ext.JSON.decode(jsonFields,true),
			fsFields = [] ;
			
		var inputTitle = tplRecord.get('html_title') ;
		var inputHtml = tplRecord.get('html_body') ;
		var showFields = false ;
	}
}) ;
