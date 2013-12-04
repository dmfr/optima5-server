Ext.define('Optima5.Modules.CrmBase.QbookInputvarFormDate' ,{
	extend: 'Optima5.Modules.CrmBase.QbookInputvarForm',
			  
	requires: [
		'Optima5.Modules.CrmBase.QbookInputvarForm'
	] ,
			  
	initComponent: function() {
		var me = this ;
		
		Ext.apply( me, {
			fieldDefaults: {
				labelAlign: 'left',
				labelWidth: 75
			},
			layout: 'anchor',
			items:[{
				xtype: 'component',
				itemId : 'title',
				html: 'Title',
				padding: '4 10 8 10'
			},{
				xtype: 'fieldset',
				title: 'Align to boundary',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype:'checkbox',
					name:'date_align_is_on',
					itemId : 'date_align_is_on',
					fieldLabel:'Do Align',
					inputValue: true,
					uncheckedValue: false
				},{
					xtype: 'combobox',
					name: 'date_align_segment_type',
					itemId : 'date_align_segment_type',
					fieldLabel: 'Segment',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['mode','lib'],
						data : [
							{mode:'WEEK', lib:'Week (Y-week)'},
							{mode:'MONTH', lib:'Month (Y-m)'},
							{mode:'YEAR', lib:'Year (Y)'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'mode'
				},{
					xtype      : 'fieldcontainer',
					itemId : 'date_align_direction_end',
					defaultType: 'radiofield',
					defaults: {
						flex: 1
					},
					layout: 'hbox',
					items: [
						{
							boxLabel  : 'Start',
							name      : 'date_align_direction_end',
							itemId : 'date_align_direction_end_false',
							inputValue : false
						}, {
							boxLabel  : 'End',
							name      : 'date_align_direction_end',
							itemId : 'date_align_direction_end_true',
							inputValue: true
						}
					]
				}]
			},{
				xtype: 'fieldset',
				title: 'Calc from',
				defaultType: 'textfield',
				defaults: {
					anchor: '100%'
				},
				layout: 'anchor',
				items: [{
					xtype:'checkbox',
					name:'date_calc_is_on',
					itemId : 'date_calc_is_on',
					fieldLabel:'Do Calc',
					inputValue: true,
					uncheckedValue: false
				},{
					xtype: 'numberfield',
					format: 'Y-m-d',
					width: 100 ,
					fieldLabel: 'Count',
					name: 'date_calc_segment_count',
					itemId : 'date_calc_segment_count'
				},{
					xtype: 'combobox',
					name: 'date_calc_segment_type',
					itemId : 'date_calc_segment_type',
					fieldLabel: 'Segment',
					forceSelection: true,
					editable: false,
					store: {
						fields: ['mode','lib'],
						data : [
							{mode:'WEEK', lib:'Week (Y-week)'},
							{mode:'MONTH', lib:'Month (Y-m)'},
							{mode:'YEAR', lib:'Year (Y)'}
						]
					},
					queryMode: 'local',
					displayField: 'lib',
					valueField: 'mode'
				}]
			}]
		}) ;
		
		
		
		this.callParent() ;
	},
	loadRecord: function(rec) {
		this.query('#title')[0].update( 'Variable : <b>' + rec.get('inputvar_lib') + '</b>' );
		this.callParent(arguments) ;
		var date_align_direction_end = rec.get('date_align_direction_end') ;
		this.query('#date_align_direction_end_true')[0].setValue(date_align_direction_end) ;
		this.query('#date_align_direction_end_false')[0].setValue(!date_align_direction_end) ;
	},
	calcLayout: function(){
		var me = this,
			form = me.getForm(),
			align_is_on = form.findField('date_align_is_on').getValue(),
			calc_is_on = form.findField('date_calc_is_on').getValue() ;
		
		this.query('#date_calc_segment_type')[0].setVisible( calc_is_on ) ;
		this.query('#date_calc_segment_count')[0].setVisible( calc_is_on ) ;
	}
}) ;