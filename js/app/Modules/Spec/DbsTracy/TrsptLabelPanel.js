Ext.define('Optima5.Modules.Spec.DbsTracy.TrsptLabelPanel',{
	extend:'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items: [{
				flex: 1,
				xtype: 'box',
				cls:'op5-waiting'
			}]
		});
		this.callParent() ;
	},
	loadFromTrsptEvent: function(trsptFilerecordId, trspteventFilerecordId) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_dbs_tracy',
				_action: 'trspt_getLabelTMS',
				trspt_filerecord_id: trsptFilerecordId,
				trsptevent_filerecord_id: trspteventFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( !ajaxResponse.success ) {
					this.destroy() ;
					return ;
				}
				this.onLoadLabelData(ajaxResponse.data) ;
			},
			callback: function() {},
			scope: this
		}) ;
	},
	onLoadLabelData: function( labelData ) {
		this.removeAll() ;
		this.add({
			flex: 1,
			xtype: 'panel',
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: [{
				xtype: 'form',
				bodyCls: 'ux-noframe-bg',
				bodyPadding: 8,
				layout: 'anchor',
				fieldDefaults: {
					labelWidth: 100,
					anchor: '100%'
				},
				items: [{
					xtype: 'displayfield',
					name: 'date_create',
					value: 'okokook'
				},{
					xtype: 'displayfield',
					name: 'date_create',
					value: 'okokook'
				}]
			},{
				flex: 1,
				xtype: 'tabpanel',
				items: [{
					title: 'Request',
					xtype: 'panel',
				},{
					title: 'Response',
					xtype: 'panel',
				}]
			}]
		},{
			flex: 1,
			xtype:'panel',
			layout: 'fit',
			items: [{
				/* solution : position absolute 50% 50% ??
				*  #content {
						display: table-cell;
						text-align: center;
						vertical-align: middle
					}
					*/
				xtype:'box',
				html: 'SQKQPKOSDSKDQPSKDOQSOP'
			}]
		});
	}
}) ;
