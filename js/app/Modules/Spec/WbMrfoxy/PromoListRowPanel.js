Ext.define('Optima5.Modules.Spec.WbMrfoxy.PromoListRowPanel',{
	extend: 'Ext.panel.Panel',
	
	rowRecord: null,
	
	initComponent: function() {
		var me = this,
			rowRecord = me.rowRecord ;
		
		Ext.apply(me,{
			border:false,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			defaults: {
				xtype:'panel',
				layout: 'anchor',
				frame: false,
				border: false,
				bodyPadding: '0px 10px',
				defaults: {
					anchor: '100%'
				}
			},
			items:[{
				items: [{
					xtype:'fieldcontainer',
					items:[{
						xtype:'fieldset',
						title: 'Situation actuelle (instant T)',
						items:[{
							xtype: 'displayfield',
							fieldLabel: 'Date start',
							fieldStyle: 'font-weight: bold',
							value: rowRecord.get('date_start')
						},{
							xtype: 'displayfield',
							fieldLabel: 'Date end',
							fieldStyle: 'font-weight: bold',
							value: rowRecord.get('date_end')
						}]
					},{
						xtype:'fieldset',
						title: 'Situation actuelle (instant T)',
						items:[{
							xtype: 'displayfield',
							fieldLabel: 'Uplift',
							value: '<b>'+rowRecord.get('calc_uplift_vol')+'</b>&nbsp;kg&nbsp&nbsp&nbsp/&nbsp;&nbsp&nbsp'+'<b>'+rowRecord.get('calc_uplift_per')+'</b>&nbsp;%',
						},{
							xtype: 'displayfield',
							fieldLabel: 'RIO',
							fieldStyle: 'font-weight: bold',
							value: rowRecord.get('calc_roi')
						}]
					}]
				}],
				flex:1
			},{
				xtype:'box',
				cls:'op5-waiting',
				flex:1,
				margin: 10
			}],
			autoDestroy: true
		}); 
		
		this.callParent() ;
		
		if( me.rowRecord ) {
			//me.setRecord() ;
		}
	},
	
}) ;