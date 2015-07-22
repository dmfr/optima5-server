Ext.define('Ext.ux.form.field.ColorPickerCombo', {
	extend: 'Ext.form.field.Text',
	requires : ['Ext.menu.ColorPicker'],
	alias: 'widget.colorpickercombo',
	value: '',
	width: 150,
	fieldLabel: 'Color',
	labelWidth: 60,
	editable: false,

	hiddenValue: '',


	onTriggerClick: function (event) {
		this.fireEvent('triggerclick', event);
	},

	getValue: function () {
		return this.hiddenValue;
	},
	getSubmitData: function() {
			var value = this.getValue() ;
			var data = {} ;
			data[this.getName()] = value ;
			return data ;
	},
	setValue: function (color) {
		this.hiddenValue = color;
		this.setFieldStyle('background-color: #' + color + '; background-image: none;');
	},


	initComponent: function () {
		this.hiddenValue = this.value;
		this.value = '';

		var config = {},
			me = this;

		Ext.apply(this, Ext.apply(this.initialConfig, config));
		Ext.apply(this,{
			triggers: {
				arrow: {
					cls: Ext.baseCSSPrefix + 'form-arrow-trigger',
					handler: function(event) {
						var colorTest = Ext.create('Ext.picker.Color') ;
						var initialColor ;
						if( Ext.Array.contains( colorTest.colors, me.value) ) {
							initialColor = me.value ;
						} else {
							initialColor = null ;
						}
						
						var colourMenu = Ext.create('Ext.menu.ColorPicker', {
							value: initialColor,
							listeners: {
								hide: function(picker) {
									Ext.defer(function(){picker.destroy();},10) ;
								},
								select: function (picker, color) {
									me.setValue(color);
									me.fireEvent('select', me, color);
								}
							}
						});
						colourMenu.showAt(event.getXY());
					}
				}
			}
		});
		this.callParent(arguments);
	}
});