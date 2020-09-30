Ext.define('Optima5.Modules.Spec.DbsTracy.GunTracy70transactionBuildWarning',{
	extend: 'Ext.form.Panel',
	
	_gridRow: null ,
	
	initComponent: function() {
		Ext.apply(this,{
			cls: 'ux-noframe-bg',
			width: 250,
			bodyPadding: 10,
			bodyCls: 'ux-noframe-bg',
			flex: 1,
			layout: 'anchor',
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 80,
				anchor: '100%'
			},
			title: 'Filters',
			items:[{
				xtype: 'hiddenfield',
				name: 'trspt_filerecord_id',
				value: this._gridRow.trspt_filerecord_id
			},{
				xtype: 'displayfield',
				fieldLabel: 'Trspt #',
				fieldStyle: 'font-weight:bold',
				value: this._gridRow.id_doc
			},{
				xtype: 'checkboxfield',
				name: 'is_warning',
				boxLabel: 'Has warning ?',
				value: this._gridRow.is_warning
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
					{ xtype: 'button', text: 'Apply', handler: function(){this.doApply()}, scope: this }
				]
			}]
		}) ;
		this.callParent() ;
	},
	doReset: function() {
		this.getForm().reset() ;
		this.doApply() ;
	},
	doApply: function() {
		this.fireEvent('submit',this,this.getForm().getValues()) ;
	},
	
}) ;
