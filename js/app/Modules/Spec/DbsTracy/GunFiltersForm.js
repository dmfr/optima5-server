Ext.define('Optima5.Modules.Spec.DbsTracy.GunFiltersForm',{
	extend: 'Ext.form.Panel',
	
	_filterValues: null ,
	
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			width: 250,
			bodyPadding: '5px 5px',
			bodyCls: 'ux-noframe-bg',
			flex: 1,
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'top',
				labelWidth: 80,
				anchor: '100%'
			},
			title: 'Filters',
			items:[{
				xtype: 'combobox',
				width: 450,
				emptyText: 'All companies',
				fieldLabel: 'Company',
				name: 'filter_soc',
				queryMode: 'local',
				forceSelection: true,
				allowBlank: false,
				editable: false,
				store: {
					fields: ['soc_code','soc_txt'],
					data: Optima5.Modules.Spec.DbsTracy.GunHelper.getSocAll()
				},
				valueField: 'soc_code',
				displayField: 'soc_txt'
			},{
				xtype: 'box',
				height: 60
			},{
				xtype: 'container',
				layout: {
					type: 'hbox',
					align: 'end',
					pack: 'end'
				},
				defaults: {minWidth: this.minButtonWidth, margin: '2px 8px'},
				items: [
					{ xtype: 'button', text: 'Apply', handler: function(){this.doApply()}, scope: this },
					{ xtype: 'button', text: 'Reset', handler: function(){this.doReset()}, scope: this },
				]
			}]
		}) ;
		this.callParent() ;
		
		this.getForm().reset() ;
		if( this._filterValues ) {
			this.getForm().setValues(this._filterValues) ;
		}
	},
	doReset: function() {
		this.getForm().reset() ;
		this.doApply() ;
	},
	doApply: function() {
		this.fireEvent('submit',this,this.getForm().getValues()) ;
	},
	
}) ;
