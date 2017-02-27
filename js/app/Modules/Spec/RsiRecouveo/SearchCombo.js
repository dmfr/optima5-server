Ext.define('Optima5.Modules.Spec.RsiRecouveo.SearchCombo',{
	extend: 'Ext.form.field.ComboBox',
	
	initComponent: function() {
		Ext.apply(this,{
			forceSelection:true,
			allowBlank:true,
			editable:true,
			typeAhead:false,
			queryMode: 'remote',
			displayField: 'id_ref',
			valueField: 'file_filerecord_id',
			queryParam: 'search_txt',
			minChars: 2,
			checkValueOnChange: function() {}, //HACK
			store: {
				fields: [
					'acc_id',
					'file_filerecord_id',
					'id_ref',
					'result_property',
					'result_value'
				],
				proxy: this.optimaModule.getConfiguredAjaxProxy({
					extraParams : {
						_moduleId: 'spec_rsi_recouveo',
						_action: 'file_searchSuggest',
						limit: 20
					},
					reader: {
						type: 'json',
						rootProperty: 'data'
					}
				}),
				listeners: {
					beforeload: this.onBeforeQueryLoad,
					scope: this
				}
			},
			matchFieldWidth: false,
			listConfig: {
				width: 250,
				getInnerTpl: function(displayField) {
					return '<div style="padding-bottom:6px"><div>{id_ref}</div><div style="text:10px">{result_property}&#160;:&#160;{result_value}</div></div>' ;
				}
			}
		}) ;
		this.callParent() ;
	},
	onBeforeQueryLoad: function(store,options) {
		this.fireEvent('beforequeryload',store,options) ;
	}
}) ;
