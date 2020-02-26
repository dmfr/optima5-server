Ext.define('Optima5.Modules.Spec.RsiRecouveo.ActionPlusMailAutoPanel',{
	extend:'Ext.form.Panel',
	
	_fileRecord: null,
	
	initComponent: function() {
		var langAtrField = 'account@LANG' ;
		var tplFields = [{
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
		}] ;
		
		var langAtrId = 'account@LANG',
			langAtrField = 'ATR_A_LANG' ;
		if( Optima5.Modules.Spec.RsiRecouveo.HelperCache.getAtrHeader(langAtrId) ) {
			var tplLangField = {
				xtype: 'combobox',
				fieldLabel: 'Langue',
				name: 'tpl_lang',
				forceSelection:true,
				allowBlank:true,
				editable:false,
				typeAhead:false,
				queryMode: 'remote',
				displayField: 'atr_value',
				valueField: 'atr_value',
				queryParam: 'search_txt',
				minChars: 1,
				checkValueOnChange: function() {}, //HACK
				store: {
					fields: [
						{name: 'atr_value', type:'string'}
					],
					proxy: this.optimaModule.getConfiguredAjaxProxy({
						extraParams : {
							_moduleId: 'spec_rsi_recouveo',
							_action: 'account_getAllAtrs',
							atr_field: langAtrField
						},
						reader: {
							type: 'json',
							rootProperty: 'data'
						}
					})
				}
			} ;
			tplFields.push(tplLangField) ;
		}
		if( true ) {
			var tplModesField = {
				xtype: 'fieldcontainer',
				fieldLabel: 'Modes d\'envoi',
				layout: 'hbox',
				items: [{
					flex: 1,
					xtype: 'op5specrsiveomailfield',
					name: 'tpl_modes_json'
				}]
			} ;
			tplFields.push(tplModesField) ;
		}
		if( false ) {
			var tplDeferField = {
				xtype: 'fieldset',
				title: 'Envoi différé',
				checkboxName: 'tpl_defer_is_on',
				checkboxToggle: true,
				items: [{
					xtype: 'datefield',
					name: 'tpl_defer_date',
					format: 'Y-m-d',
					fieldLabel: 'Date prévue',
					minValue: new Date()
				}]
			} ;
			tplFields.push(tplDeferField) ;
		}
		
		
		Ext.apply(this,{
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 0,
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			fieldDefaults: {
				labelWidth: 100,
				anchor: '100%'
			},
			items: [{
				xtype: 'fieldset',
				title: 'Type d\'action',
				layout: {
					type: 'hbox',
					align: 'begin'
				},
				items: [{
					flex: 1,
					xtype: 'displayfield',
					fieldLabel: 'Action',
					value: '<b>Action automatique</b>'
				},{
					flex: 1,
					itemId: 'cntTpl',
					xtype: 'fieldcontainer',
					layout: 'anchor',
					items: tplFields
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
