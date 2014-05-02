Ext.define('Optima5.Modules.Spec.DbsPeople.RealVirtualPanel',{
	extend:'Ext.panel.Panel',
	requires:[
		'Ext.ux.dams.ColorCombo',
		'Ext.ux.dams.ComboBoxCached'
	],

	initComponent: function() {
		var me = this ;
		
		if( (me.parentRealPanel) instanceof Optima5.Modules.Spec.DbsPeople.RealPanel ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No parent reference ?') ;
		}
		if( (me.peopledayRecord) ) {} else {
			Optima5.Helper.logError('Spec:DbsPeople:RealAdvancedPanel','No peopledayRecord instance ?') ;
		}
		
		
		Ext.apply(me,{
			bodyCls: 'ux-noframe-bg',
			layout: {
				type:'vbox',
				align:'stretch'
			},
			items: [{
				xtype: 'form',
				border: false,
				height: 60,
				bodyPadding: 5,
				bodyCls: 'ux-noframe-bg',
				layout:'hbox',
				items:[{
					xtype:'fieldcontainer',
					flex: 3,
					layout: 'anchor',
					defaults: {
						labelAlign: 'left',
						labelWidth: 50,
						anchor: '100%',
						margin: 1
					},
					items: [{
						xtype:'displayfield',
						fieldLabel: 'Nom',
						value: '<b>' + me.peopledayRecord.get('people_name') + '</b>'
					},{
						xtype:'displayfield',
						fieldLabel: 'Date',
						value: '<b>' + Ext.Date.format( Ext.Date.parse(me.peopledayRecord.get('date_sql'),'Y-m-d'), 'd/m/Y') + '</b>'
					}]
				},{
					xtype:'fieldcontainer',
					flex: 1,
					margin: 10,
					layout: 'anchor',
					defaults: {
						labelAlign: 'left',
						labelWidth: 50,
						anchor: '100%',
						margin: 1
					},
					items: [{
						xtype:'checkbox',
						itemId: 'absCheckbox',
						boxLabel: 'Absent',
						listeners: {
							change: function() {
								this.calcLayout() ;
							},
							scope: this
						}
					}]
				}]
			},{
				xtype:'form',
				flex:1,
				bodyPadding: 5,
				bodyCls: 'ux-noframe-bg',
				itemId: 'absPanel',
				hidden: true,
				frame: true,
				border: true,
				margin: '4px',
				title: 'Absence / Congé planifié',
				defaults: {
					labelAlign: 'left',
					labelWidth: 70,
					anchor: '100%'
				},
				items: [{
					xtype:'combobox',
					itemId: 'absCombobox',
					matchFieldWidth:false,
					listConfig:{width:200},
					forceSelection:true,
					allowBlank:false,
					editable:false,
					queryMode: 'local',
					displayField: 'text',
					valueField: 'id',
					fieldLabel: 'Motif',
					name: 'rh_abs_code' ,
					store: {
						fields:['id','text'],
						data: Optima5.Modules.Spec.DbsPeople.HelperCache.forTypeGetAll("ABS")
					}
				},{
					xtype: 'datefield',
					allowBlank: false,
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
					fieldLabel: 'Début',
					name: 'rh_abs_date_start',
					anchor: '',
					width: 170
				},{
					xtype: 'datefield',
					allowBlank: false,
					format: 'd/m/Y',
					submitFormat: 'Y-m-d',
					fieldLabel: 'Fin',
					name: 'rh_abs_date_end',
					anchor: '',
					width: 170
				}]
			}]
		});
		
		this.callParent() ;
	},
	calcLayout: function() {
		var me = this,
			absCheckbox = this.down('#absCheckbox'),
			absPanel = this.down('#absPanel') ;
		
		absPanel.setVisible(absCheckbox.getValue()) ;
		
		return ;
	},
	doSave: function() {
		this.rhAbsSave() ;
	},
	rhAbsLoad: function() {
		
	},
	rhAbsSave: function() {
		var rhAbsValues = this.down('#absPanel').getValues(),
			absCheckbox = this.down('#absCheckbox') ;
		
		Ext.apply(rhAbsValues,{
			rh_abs_is_on: absCheckbox.getValue()
		}) ;
		
		//console.dir(rhAbsValues) ;
	}
	
});