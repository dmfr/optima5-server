Ext.define('Optima5.Modules.CrmBase.QwindowAutorunForm',{
	extend:'Ext.form.Panel',
	
	initComponent: function() {
		Ext.apply(this, {
			title: 'Autorun setup',
			bodyCls: 'ux-noframe-bg',
			bodyPadding: '10px 10px',
			border: false,
			frame: true,
			height: 200,
			layout: 'anchor',
			fieldDefaults: {
				labelWidth: 115,
				anchor: '100%'
			},
			items:[{
				xtype: 'fieldset',
				title: 'Enable autorun(s)',
				checkboxToggle: true,
				checkboxName: 'autorun_is_on',
				items: [{
					xtype: 'radiogroup',
					fieldLabel: 'Autorun mode',
					// Arrange radio buttons into two columns, distributed vertically
					columns: 1,
					vertical: true,
					defaults: {
						name: 'autorun_mode'
					},
					items: [
						{ boxLabel: 'Continuous repeat', inputValue: 'repeat' },
						{ boxLabel: 'Daily schedule', inputValue: 'schedule'}
					],
					listeners: {
						change: function() {
							this.evalForm();
						},
						scope: this
					}
				},{
					xtype: 'numberfield',
					name: 'autorun_repeat_mndelay',
					fieldLabel: 'Repeat delay (mn)',
					hideTrigger: true,
					anchor: '',
					width: 170
				},{
					xtype: 'timefield',
					name: 'autorun_schedule_time',
					fieldLabel: 'Start time',
					format: 'H:i',
					anchor: '',
					width: 190
				}]
			}],
			buttons: [{
				xtype: 'button',
				text: 'OK',
				handler: function( btn ) {
					this.doSave() ;
				},
				scope: this
			}]
		});
		this.callParent() ;
		this.getForm().setValues({autorun_is_on:false}) ;
		this.evalForm() ;
		this.doLoad() ;
	},
	evalForm: function() {
		var form = this.getForm(),
			values = form.getValues() ;
		console.dir(values) ;
		form.findField('autorun_repeat_mndelay').setVisible( (values['autorun_mode']=='repeat') ) ;
		form.findField('autorun_schedule_time').setVisible( (values['autorun_mode']=='schedule') ) ;
	},
	
	showLoadmask: function() {
		if( this.rendered ) {
			this.doShowLoadmask() ;
		} else {
			this.on('afterrender',this.doShowLoadmask,this,{single:true}) ;
		}
	},
	doShowLoadmask: function() {
		if( this.loadMask ) {
			return ;
		}
		this.loadMask = Ext.create('Ext.LoadMask',{
			target: this,
			msg:"Please wait..."
		}).show();
	},
	hideLoadmask: function() {
		this.un('afterrender',this.doShowLoadmask,this) ;
		if( this.loadMask ) {
			this.loadMask.destroy() ;
			this.loadMask = null ;
		}
	},
	
	doLoad: function() {
		this.showLoadmask() ;
		var me = this ;
		
		var ajaxParams = this._ajaxParams ;
		Ext.apply( ajaxParams, {
			//_action: undefined,
			//_transaction_id: undefined,
			_subaction: 'autorun_get'
		});
		
		me.optimaModule.getConfiguredAjaxConnection().request({
			params: ajaxParams ,
			success: function(response) {
				if( Ext.decode(response.responseText).success == false ) {
					Ext.Msg.alert('Failed', 'Failed');
				}
				this.getForm().setValues( Ext.decode(response.responseText).data ) ;
			},
			callback: function() {
				this.hideLoadmask() ;
			},
			scope: me
		});
	},
	
	
	doSave: function() {
		var me = this ;
		
		var baseForm = this.getForm(),
			values = baseForm.getFieldValues() ;
		if( Ext.isDate(values['autorun_schedule_time']) ) {
			values['autorun_schedule_time'] = Ext.Date.format(values['autorun_schedule_time'],'H:i') ;
		}
		
		if( !values['autorun_is_on'] ) {
			baseForm.reset();
			baseForm.setValues({autorun_is_on:false}) ;
		}
		
		if( values['autorun_is_on'] && Ext.isEmpty(values['autorun_mode']) ) {
			return ;
		}
		Ext.Array.each( ['autorun_repeat_mndelay','autorun_schedule_time'], function(fieldName) {
			var field = baseForm.findField(fieldName) ;
			field.allowBlank = !field.isVisible(true) ;
		});
		
		if(baseForm.isValid()){
			var ajaxParams = this._ajaxParams ;
			Ext.apply( ajaxParams, {
				//_action: undefined,
				//_transaction_id: undefined,
				_subaction: 'autorun_set',
				data: Ext.JSON.encode(values)
			});
			
			this.showLoadmask() ;
			me.optimaModule.getConfiguredAjaxConnection().request({
				params: ajaxParams ,
				success: function(response) {
					if( Ext.decode(response.responseText).success == false ) {
						Ext.Msg.alert('Failed', 'Failed');
					} else {
						this.optimaModule.postCrmEvent('toggleautorunquery',{
							qType:me.qType,
							queryId:me.queryId
						}) ;

						this.destroy() ;
					}
				},
				callback: function() {
					this.hideLoadmask() ;
				},
				scope: me
			});
		}
	}
}) ;
