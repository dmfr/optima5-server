Ext.define('Optima5.Modules.Spec.RsiRecouveo.SmsPreviewPanel',{
	extend: 'Ext.panel.Panel',
	
	initComponent: function() {
		Ext.apply(this,{
			layout: {
				type: 'vbox',
				align: 'stretch'
			},
			items: {
				flex: 1,
				xtype: 'box',
				cls:'op5-waiting'
			}
		});
		this.callParent() ;
		if( this._smsFilerecordId ) {
			Ext.defer(function(){
				this.loadSmsData(this._smsFilerecordId) ;
			},500,this) ;
		}
		else if( this._smsData ) {
			Ext.defer(function(){
				this.buildPreview(this._smsData) ;
			},500,this) ;
		}
	},
	loadSmsData: function(smsFilerecordId) {
		this.optimaModule.getConfiguredAjaxConnection().request({
			params: {
				_moduleId: 'spec_rsi_recouveo',
				_action: 'sms_getSmsData',
				sms_filerecord_id: smsFilerecordId
			},
			success: function(response) {
				var ajaxResponse = Ext.decode(response.responseText) ;
				if( ajaxResponse.success == false ) {
					Ext.MessageBox.alert('Error','Error') ;
					return ;
				}
				this.buildPreview(ajaxResponse.data) ;
			},
			scope: this
		});
	},
	buildPreview: function(smsData) {
		var elements = [{
			xtype: 'form',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: 12,
			layout: 'anchor',
			fieldDefaults: {
				labelWidth: 70,
				anchor: '100%'
			},
			items: [{
				xtype: 'displayfield',
				fieldLabel: 'Date',
				fieldStyle: 'font-weight: bold',
				value: smsData.sms_date
			},{
				xtype: 'displayfield',
				fieldLabel: 'Tel #',
				fieldStyle: 'font-weight: bold',
				value: smsData.sms_recep_num
			}]
		},{
			xtype: 'panel',
			flex: 1,
			frame: true,
			//bodyCls: 'ux-noframe-bg',
			padding: 10,
			layout: 'fit',
			items: [{
				xtype: 'component',
				scrollable: true,
				tpl: [
					'<div class="op5-spec-rsiveo-smspreview"><pre>{[this.escapeJson(values.sms_text)]}</pre></div>',
					{
						// XTemplate configuration:
						disableFormats: true,
						
						// member functions:
						escapeJson: function(jsonTxt){
							if( Ext.isString(jsonTxt) ) {
								return Ext.String.htmlEncode(jsonTxt.trim()) ;
							}
							return '&#160;' ;
						}
					}
				],
				data: {
					sms_text: smsData.sms_text
				}
			}]
		}] ;
		this.removeAll() ;
		this.add(elements) ;
	}
	
}) ;
