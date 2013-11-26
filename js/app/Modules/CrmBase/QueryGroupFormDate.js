Ext.define('Optima5.Modules.CrmBase.QueryGroupFormDate' ,{
	extend: 'Optima5.Modules.CrmBase.QueryGroupForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QueryGroupForm'
	] ,
			  
	initComponent: function() {
		var me = this,
			extrapolateCfgOnly = me.extrapolateCfgOnly ;
		
		Ext.apply( me, {
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75
			},
			layout: 'anchor',
			items:[{
				xtype: 'fieldset',
				title: 'Aggregate Date Mode',
				hidden: extrapolateCfgOnly,
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype: 'combobox',
					name: 'group_date_type',
					fieldLabel: 'Group by',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['mode','lib'],
						data : [
							{mode:'DAY', lib:'Day (Y-m-d)'},
							{mode:'WEEK', lib:'Week (Y-week)'},
							{mode:'MONTH', lib:'Month (Y-m)'},
							{mode:'YEAR', lib:'Year (Y)'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'mode'
				}]
			},{
				xtype: 'fieldset',
				title: 'Extrapolate on timeline',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype:'checkbox',
					name:'extrapolate_is_on',
					checked: (extrapolateCfgOnly ? true : false),
					readOnly: extrapolateCfgOnly,
					fieldLabel:'Extrapolate'
				},{
					xtype: 'datefield',
					format: 'Y-m-d',
					width: 100 ,
					fieldLabel: 'Base from',
					name: 'extrapolate_src_date_from'
				},{
					xtype: 'datefield',
					format: 'Y-m-d',
					width: 100 ,
					fieldLabel: 'Output from',
					name: 'extrapolate_calc_date_from'
				},{
					xtype: 'datefield',
					format: 'Y-m-d',
					width: 100 ,
					fieldLabel: 'Output to',
					name: 'extrapolate_calc_date_to'
				}]
			}]
		}) ;
		
		
		
		this.callParent() ;
	},
	calcLayout: function(){
		var me = this,
			extrapolateCfgOnly = me.extrapolateCfgOnly,
			form = me.getForm(),
			extrapolate_is_on = ( extrapolateCfgOnly ? true : form.findField('extrapolate_is_on').getValue() ),
			field_extrapolate_src_from = form.findField('extrapolate_src_date_from'),
			field_extrapolate_calc_from = form.findField('extrapolate_calc_date_from'),
			field_extrapolate_calc_to = form.findField('extrapolate_calc_date_to') ;
		
		field_extrapolate_src_from.setVisible( extrapolate_is_on ) ;
		field_extrapolate_calc_from.setVisible( extrapolate_is_on ) ;
		field_extrapolate_calc_to.setVisible( extrapolate_is_on ) ;
	}
}) ;